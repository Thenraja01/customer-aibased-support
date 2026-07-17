import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminAPI } from "@/api";
import { BarChart3, Download, TrendingUp, Users, Table2, Calendar } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function LogManagementPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => { loadStats(); }, [fromDate, toDate]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await AdminAPI.getAuditStats(params);
      if (res.data.success) setStats(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const url = `${import.meta.env.VITE_BACKEND_URL}/audit-logs/export?${params.toString()}`;
    const token = localStorage.getItem("token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "audit-logs.csv";
        a.click();
      })
      .catch(console.error);
  };

  if (loading && !stats) return <div className="py-20 text-center text-muted-foreground">Loading log analytics...</div>;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Management</h1>
          <p className="text-sm text-muted-foreground">Monitor system activity with analytics and export.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Download size={16} /> Export CSV
        </button>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-background text-xs dark:border-white/[0.06]" />
        </div>
        <span className="text-xs text-muted-foreground">to</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-background text-xs dark:border-white/[0.06]" />
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Logs</p>
              <p className="text-2xl font-bold mt-1">{stats?.total || 0}</p>
            </div>
            <BarChart3 size={20} className="text-primary" />
          </div>
        </div>
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unique Actions</p>
              <p className="text-2xl font-bold mt-1">{stats?.byAction?.length || 0}</p>
            </div>
            <TrendingUp size={20} className="text-secondary" />
          </div>
        </div>
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold mt-1">{stats?.byUser?.length || 0}</p>
            </div>
            <Users size={20} className="text-primary" />
          </div>
        </div>
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tables Tracked</p>
              <p className="text-2xl font-bold mt-1">{stats?.byTable?.length || 0}</p>
            </div>
            <Table2 size={20} className="text-secondary" />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <h3 className="text-sm font-medium mb-4">Actions by Type</h3>
          {stats?.byAction?.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byAction.slice(0, 10).map((item: any) => ({ name: item._id, count: item.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No data</p>
          )}
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <h3 className="text-sm font-medium mb-4">Activity by Table</h3>
          {stats?.byTable?.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byTable.map((item: any) => ({ name: item._id, count: item.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No data</p>
          )}
        </div>
      </div>

      {stats?.byDay?.length > 0 && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <h3 className="text-sm font-medium mb-4">Daily Activity (Last 30 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.byDay.map((day: any) => ({ date: day._id.slice(5), count: day.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="count" name="Actions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats?.byUser?.length > 0 && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
          <h3 className="text-sm font-medium mb-4">Top Active Users</h3>
          <div className="space-y-2">
            {stats.byUser.map((user: any) => (
              <div key={user._id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {user.userName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.userName || "Unknown"}</p>
                    <p className="text-[11px] text-muted-foreground">{user.userEmail}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">{user.count} actions</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
