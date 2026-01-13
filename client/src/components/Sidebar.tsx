import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/warnings", label: "Warnings", icon: AlertTriangle },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#1E1F22] border-r border-[#1E1F22] shadow-2xl z-50 flex flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-[#2B2D31]">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold font-display tracking-tight text-white">
          ModPanel
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;

          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer font-medium text-[15px]",
                  isActive
                    ? "bg-[#3f4147] text-white"
                    : "text-[#949BA4] hover:bg-[#35373C] hover:text-[#DBDEE1]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                  />
                )}
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#949BA4]")} />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#2B2D31]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#313338] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">System Online</p>
            <p className="text-xs text-[#949BA4]">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
