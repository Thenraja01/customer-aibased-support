import { useEffect, memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Ticket, Clock, CheckCircle2, ArrowRight, Headphones, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useChat } from "@/hooks/useChat";
import { staggerContainer, staggerItem, slideUp } from "@/lib/animations";

interface StatCardProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  color: string;
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
});

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tickets, loadAllTickets, loadStats } = useTickets();
  const { chats, loadAllChats } = useChat();

  useEffect(() => {
    loadAllTickets();
    loadAllChats();
    loadStats();
  }, [loadAllTickets, loadAllChats, loadStats]);

  const openTickets = tickets.filter((t: any) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedTickets = tickets.filter((t: any) => t.status === "resolved").length;
  const openChats = chats.filter((c: any) => c.status === "open").length;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Agent"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage chats, tickets, and assist customers.
        </p>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MessageSquare} label="Open Chats" value={openChats} color="bg-primary/10 text-primary" />
        <StatCard icon={Ticket} label="Open Tickets" value={openTickets} color="bg-primary/10 text-primary" />
        <StatCard icon={Clock} label="In Progress" value={inProgressTickets} color="bg-accent text-accent-foreground" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolvedTickets} color="bg-primary/10 text-primary" />
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/agent/chats")}
          className="group flex items-center gap-4 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 text-left dark:hover:border-primary/20"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
            <MessageSquare size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Manage Chats</p>
            <p className="text-xs text-muted-foreground mt-0.5">View and respond to active conversations</p>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => navigate("/agent/tickets")}
          className="group flex items-center gap-4 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 text-left dark:hover:border-secondary/20"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
            <Ticket size={18} className="text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Manage Tickets</p>
            <p className="text-xs text-muted-foreground mt-0.5">Review and assign support tickets</p>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {chats.length > 0 && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-xs">
          <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-medium">Active Chats</h3>
            <button
              onClick={() => navigate("/agent/chats")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y dark:divide-white/[0.04]">
            {chats.filter((c: any) => c.status === "open").slice(0, 5).map((chat: any) => (
              <div
                key={chat._id}
                className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                onClick={() => navigate("/agent/chats")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Headphones size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{chat.topic || "Support Chat"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {chat.user_id?.name || "Customer"} - {new Date(chat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Open
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-xs">
          <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Tickets</h3>
            <button
              onClick={() => navigate("/agent/tickets")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y dark:divide-white/[0.04]">
            {tickets.slice(0, 5).map((ticket: any) => (
              <div key={ticket._id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {ticket.status === "open" ? (
                    <AlertCircle size={14} className="text-primary flex-shrink-0" />
                  ) : ticket.status === "in_progress" ? (
                    <Clock size={14} className="text-accent-foreground flex-shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{ticket.subject || ticket.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ticket.user_id?.name || "Customer"} - {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-3 flex-shrink-0 ${
                    ticket.status === "open"
                      ? "bg-primary/10 text-primary"
                      : ticket.status === "in_progress"
                      ? "bg-accent text-accent-foreground"
                      : ticket.status === "resolved"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ticket.status?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
