import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AdminAPI } from "@/api";
import { Users, Ticket, MessageSquare, FileText, Clock, CheckCircle2 } from "lucide-react";
import { staggerContainer, staggerItem, slideUp } from "@/lib/animations";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    aiSessions: 0,
    pendingDocs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.organization_id) return;
    const orgId = typeof user.organization_id === "string" ? user.organization_id : user.organization_id._id;
    try {
      const res = await AdminAPI.getAnalyticsDashboard({ organizationId: orgId });
      const data = res.data.data;
      
      setStats({
        totalUsers: data.users?.total || 0,
        activeUsers: data.users?.byStatus?.active || 0,
        openTickets: data.tickets?.byStatus?.open || 0,
        pendingTickets: data.tickets?.byStatus?.in_progress || 0,
        resolvedTickets: data.tickets?.byStatus?.resolved || 0,
        aiSessions: data.usage?.totalSessions || 0,
        pendingDocs: data.documents?.byStatus?.pending || 0,
      });
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-2xl font-bold">{loading ? "-" : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Admin"}! Here is an overview of your organization.
        </p>
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Ticket}
          label="Open Tickets"
          value={stats.openTickets}
          color="bg-secondary/10 text-secondary"
        />
        <StatCard
          icon={MessageSquare}
          label="AI Sessions"
          value={stats.aiSessions}
          color="bg-accent text-accent-foreground"
        />
        <StatCard
          icon={FileText}
          label="Pending Docs"
          value={stats.pendingDocs}
          color="bg-primary/10 text-primary"
        />
      </motion.div>

      <motion.div variants={slideUp} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Clock}
          label="In Progress Tickets"
          value={stats.pendingTickets}
          color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved Tickets"
          value={stats.resolvedTickets}
          color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-muted text-muted-foreground"
        />
      </motion.div>
    </motion.div>
  );
}
