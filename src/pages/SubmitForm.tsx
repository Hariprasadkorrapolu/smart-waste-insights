import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, User, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().trim().min(5, "Address must be at least 5 characters").max(300),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select a gender" }),
  age: z.number().int().min(1, "Age must be at least 1").max(150, "Invalid age"),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address").max(255),
});

type FormData = z.infer<typeof formSchema>;

const SubmitForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    const parsed = formSchema.safeParse({
      ...form,
      age: form.age ? Number(form.age) : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
      return;
    }

    // Store form data in sessionStorage for camera page
    sessionStorage.setItem("wasteFormData", JSON.stringify(parsed.data));
    navigate("/capture");
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-lg bg-card rounded-3xl shadow-elevated p-8 md:p-10"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          Submit Your Details
        </h1>
        <p className="text-muted-foreground text-sm mb-8">Fill in the form below to register your waste collection data.</p>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2 mb-1.5">
              <User className="w-4 h-4 text-primary" /> Full Name
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={form.name || ""}
              onChange={(e) => update("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address" className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Address
            </Label>
            <Input
              id="address"
              placeholder="123 Green Street, Eco City"
              value={form.address || ""}
              onChange={(e) => update("address", e.target.value)}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
          </div>

          {/* Gender & Age Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Gender</Label>
              <Select onValueChange={(v) => update("gender", v)} value={form.gender || ""}>
                <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive mt-1">{errors.gender}</p>}
            </div>
            <div>
              <Label htmlFor="age" className="mb-1.5 block">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                min={1}
                max={150}
                value={form.age || ""}
                onChange={(e) => update("age", e.target.value as any)}
                className={errors.age ? "border-destructive" : ""}
              />
              {errors.age && <p className="text-xs text-destructive mt-1">{errors.age}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2 mb-1.5">
              <Phone className="w-4 h-4 text-primary" /> Phone
            </Label>
            <Input
              id="phone"
              placeholder="+1 234 567 890"
              value={form.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4 text-primary" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={form.email || ""}
              onChange={(e) => update("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
        </div>

        <motion.div className="mt-8" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleSubmit} className="w-full rounded-full py-6 text-base font-display font-semibold shadow-soft">
            Continue to Camera <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubmitForm;
