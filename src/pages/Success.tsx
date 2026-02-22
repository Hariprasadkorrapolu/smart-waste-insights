import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";

const Success: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Submission Complete!</h1>
        <p className="text-muted-foreground mb-8">
          Your waste collection data has been recorded successfully. Thank you for contributing to a cleaner environment.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-full px-6">
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
          <Button onClick={() => navigate("/submit")} className="rounded-full px-6 shadow-soft">
            Submit Another
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Success;
