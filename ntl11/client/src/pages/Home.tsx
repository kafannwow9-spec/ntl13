import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { StatsCard } from "@/components/StatsCard";
import { 
  ShieldAlert, 
  LayoutTemplate, 
  Activity, 
  Server,
  Loader2,
  Ban,
  UserX,
  Plus,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BotBlacklist } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const { data: botBlacklist, isLoading: blacklistLoading } = useQuery<BotBlacklist[]>({
    queryKey: ["/api/blacklist/bot"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: { userId: string; reason: string }) => {
      const res = await fetch("/api/blacklist/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add to blacklist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist/bot"] });
      setIsDialogOpen(false);
      setUserId("");
      setReason("");
      toast({ title: "Success", description: "User added to bot blacklist" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blacklist/bot/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove from blacklist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist/bot"] });
      toast({ title: "Success", description: "User removed from bot blacklist" });
    },
  });

  if (statsLoading || blacklistLoading) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#313338] flex flex-col md:flex-row font-body text-[#DBDEE1]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-72">
        <MobileNav />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-white font-display tracking-tight">
                  Bot Management
                </h1>
                <p className="text-[#949BA4]">
                  Manage bot-wide settings and restrictions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard
                label="Total Warnings"
                value={stats?.warningCount || 0}
                icon={ShieldAlert}
                color="danger"
                delay={0}
              />
              <StatsCard
                label="Active Panels"
                value={stats?.panelCount || 0}
                icon={LayoutTemplate}
                color="primary"
                delay={0.1}
              />
              <StatsCard
                label="Bot Status"
                value={stats?.botStatus === "online" ? "Online" : "Offline"}
                icon={Activity}
                color={stats?.botStatus === "online" ? "success" : "danger"}
                delay={0.2}
              />
              <StatsCard
                label="Blacklisted Users"
                value={botBlacklist?.length || 0}
                icon={Ban}
                color="danger"
                delay={0.3}
              />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#2B2D31] rounded-xl p-6 border border-[#1E1F22] shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <UserX className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-white font-display">Bot Blacklist (Global)</h2>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                      <Plus className="w-4 h-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#313338] border-[#1E1F22] text-white">
                    <DialogHeader>
                      <DialogTitle>Add User to Bot Blacklist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="userId">Discord User ID</Label>
                        <Input 
                          id="userId" 
                          value={userId} 
                          onChange={(e) => setUserId(e.target.value)}
                          placeholder="e.g. 123456789012345678"
                          className="bg-[#1E1F22] border-[#1E1F22]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Input 
                          id="reason" 
                          value={reason} 
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Why is this user blacklisted?"
                          className="bg-[#1E1F22] border-[#1E1F22]"
                        />
                      </div>
                      <Button 
                        onClick={() => addMutation.mutate({ userId, reason })}
                        disabled={addMutation.isPending || !userId || !reason}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Blacklist User"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1E1F22] text-[#949BA4] text-sm uppercase">
                      <th className="pb-3 font-medium">User ID</th>
                      <th className="pb-3 font-medium">Reason</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1F22]">
                    {botBlacklist?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#949BA4]">
                          No users in global blacklist.
                        </td>
                      </tr>
                    ) : (
                      botBlacklist?.map((user) => (
                        <tr key={user.userId} className="text-[#DBDEE1]">
                          <td className="py-4 font-mono text-sm">{user.userId}</td>
                          <td className="py-4">{user.reason}</td>
                          <td className="py-4 text-sm text-[#949BA4]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMutation.mutate(user.userId)}
                              disabled={removeMutation.isPending}
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
