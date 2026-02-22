import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Could not get user info.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!roles) {
      await supabase.auth.signOut();
      toast({ title: "Access Denied", description: "You do not have admin privileges.", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Welcome!", description: "Logged in successfully." });
    navigate("/admin");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm bg-card rounded-3xl shadow-elevated p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4 text-primary" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="flex items-center gap-2 mb-1.5">
              <Lock className="w-4 h-4 text-primary" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full py-5 font-display font-semibold shadow-soft">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
