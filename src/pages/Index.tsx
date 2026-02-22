import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FloatingBin from "@/components/FloatingBin";
import { Leaf, Recycle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const bins = [
  { color: "hsl(142, 60%, 42%)", label: "Organic", icon: "🟢", delay: 0, x: 8, y: 15 },
  { color: "hsl(210, 65%, 48%)", label: "Recyclable", icon: "🔵", delay: 1, x: 75, y: 10 },
  { color: "hsl(45, 90%, 52%)", label: "Plastic", icon: "🟡", delay: 2, x: 12, y: 60 },
  { color: "hsl(0, 70%, 50%)", label: "Hazardous", icon: "🔴", delay: 3, x: 78, y: 55 },
];

const features = [
  { icon: Recycle, title: "Smart Collection", desc: "Efficient waste categorization and tracking" },
  { icon: Shield, title: "Secure Data", desc: "Your information is safely stored and protected" },
  { icon: Leaf, title: "Eco-Friendly", desc: "Contributing to a cleaner, greener future" },
];

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-earth overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        {/* Floating Bins */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {bins.map((bin) => (
              <FloatingBin key={bin.label} {...bin} />
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Recycle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">Smart Waste Management</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-4">
            <span className="text-foreground">Smart Solid Waste</span>
            <br />
            <span className="text-gradient-hero">Data Collection</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            A modern, interactive system for collecting and managing solid waste data efficiently and securely.
          </p>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/submit")}
              className="rounded-full px-8 py-6 text-lg font-display font-semibold shadow-elevated"
            >
              Submit Your Details
            </Button>
          </motion.div>
        </motion.div>

        {/* Decorative circle */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-card rounded-2xl p-6 shadow-soft text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <p className="text-sm text-muted-foreground">
          © 2026 Smart Solid Waste Data Collection System
        </p>
        <button
          onClick={() => navigate("/admin/login")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Admin
        </button>
      </footer>
    </div>
  );
};

export default Index;
