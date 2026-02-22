import React from "react";
import { motion } from "framer-motion";

interface FloatingBinProps {
  color: string;
  label: string;
  icon: string;
  delay: number;
  x: number;
  y: number;
}

const FloatingBin: React.FC<FloatingBinProps> = ({ color, label, icon, delay, x, y }) => {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-2 cursor-pointer select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.2, duration: 0.6, type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
      drag
      dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
      dragElastic={0.3}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
    >
      <motion.div
        className="shadow-bin rounded-2xl p-5 backdrop-blur-sm"
        style={{ backgroundColor: color }}
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 3 + delay * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.3,
        }}
      >
        <span className="text-4xl md:text-5xl">{icon}</span>
      </motion.div>
      <motion.span
        className="text-xs font-display font-semibold tracking-wide text-muted-foreground"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 0.2 }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
};

export default FloatingBin;
