import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "success" | "danger" | "warning";
  delay?: number;
}

const colors = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  danger: "bg-red-500/10 text-red-500 border-red-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export function StatsCard({ label, value, icon: Icon, color = "primary", delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={`
        relative overflow-hidden rounded-xl p-6
        bg-[#2B2D31] border border-transparent
        hover:border-white/5 hover:shadow-xl hover:translate-y-[-2px]
        transition-all duration-300
      `}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#949BA4] uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-3xl font-bold text-white font-display">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]} shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
}
