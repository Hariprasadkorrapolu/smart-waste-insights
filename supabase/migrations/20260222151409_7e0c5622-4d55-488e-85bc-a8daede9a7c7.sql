
-- 1. Create role enum, user_roles, and has_role function
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Admins can read user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert submissions"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete submissions"
ON public.submissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('submission-photos', 'submission-photos', true);

CREATE POLICY "Anyone can upload submission photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'submission-photos');

CREATE POLICY "Public read access for submission photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'submission-photos');

CREATE POLICY "Admins can delete submission photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'submission-photos' AND public.has_role(auth.uid(), 'admin'));
