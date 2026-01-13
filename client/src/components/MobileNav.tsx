import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertTriangle, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/warnings", label: "Warnings", icon: AlertTriangle },
  ];

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-[#1E1F22] border-b border-[#2B2D31] sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <span className="font-bold font-display text-white">ModPanel</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-[#949BA4]">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-[#1E1F22] border-r border-[#2B2D31] p-0">
          <div className="p-6 flex items-center gap-3 border-b border-[#2B2D31]">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold font-display text-white">
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer font-medium text-[15px]",
                      isActive
                        ? "bg-[#3f4147] text-white"
                        : "text-[#949BA4] hover:bg-[#35373C] hover:text-[#DBDEE1]"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#949BA4]")} />
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
