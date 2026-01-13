import { useWarnings } from "@/hooks/use-warnings";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Loader2, ShieldAlert, Calendar, User, UserCog, Search } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Warnings() {
  const { data: warnings, isLoading, isError } = useWarnings();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWarnings = warnings?.filter(w => 
    w.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#313338] flex flex-col md:flex-row font-body">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-72">
        <MobileNav />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-primary" />
                  Warning Logs
                </h1>
                <p className="text-[#949BA4] mt-1">
                  History of all moderation warnings issued in the server.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949BA4]" />
                <input 
                  type="text"
                  placeholder="Search by User ID or Reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1E1F22] border border-[#1E1F22] rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#949BA4] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="bg-[#2B2D31] rounded-xl p-12 flex flex-col items-center justify-center border border-[#1E1F22] shadow-sm">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-[#949BA4]">Loading warning history...</p>
              </div>
            ) : isError ? (
              <div className="bg-[#2B2D31] rounded-xl p-8 border border-red-500/20 text-center">
                <p className="text-red-400">Failed to load warnings. Please try again later.</p>
              </div>
            ) : filteredWarnings?.length === 0 ? (
              <div className="bg-[#2B2D31] rounded-xl p-12 text-center border border-[#1E1F22] shadow-sm">
                <div className="w-16 h-16 bg-[#313338] rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-[#949BA4]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No warnings found</h3>
                <p className="text-[#949BA4]">There are no recorded warnings matching your criteria.</p>
              </div>
            ) : (
              <div className="bg-[#2B2D31] rounded-xl border border-[#1E1F22] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#1E1F22] border-b border-[#1E1F22]">
                        <th className="px-6 py-4 text-xs font-bold text-[#949BA4] uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#949BA4] uppercase tracking-wider">Moderator</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#949BA4] uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#949BA4] uppercase tracking-wider text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1F22]">
                      {filteredWarnings?.map((warning, idx) => (
                        <motion.tr 
                          key={warning.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-[#313338] transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-white font-medium font-mono text-sm group-hover:text-primary transition-colors">
                                {warning.userId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[#DBDEE1]">
                              <UserCog className="w-4 h-4 text-[#949BA4]" />
                              <span className="font-mono text-xs text-[#949BA4]">{warning.moderatorId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              {warning.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-[#949BA4]">
                              <span className="text-sm">
                                {warning.createdAt 
                                  ? format(new Date(warning.createdAt), "MMM d, yyyy • h:mm a")
                                  : "Unknown date"}
                              </span>
                              <Calendar className="w-4 h-4 opacity-50" />
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
