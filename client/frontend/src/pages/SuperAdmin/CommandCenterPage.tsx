import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert, Activity, Building2, Users, Bot, Wifi, AlertTriangle,
  Power, Megaphone, PlusCircle, UserCheck, RefreshCw, Database,
  ScrollText, Sparkles, ArrowUpRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";


export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  // Modals
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);

  // Notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("info");

  // Impersonate
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await AdminAPI.getCommandCenterStatus();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to load platform status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleMaintenance = async () => {
    if (!data) return;
    const nextState = !data.platformStatus?.maintenanceMode;
    setConfirmMessage(`Are you sure you want to ${nextState ? "ENABLE" : "DISABLE"} Maintenance Mode?`);
    setConfirmAction(() => async () => {
      try {
        setActionLoading("maintenance");
        const res = await AdminAPI.toggleMaintenanceMode(nextState);
        if (res.data?.success) {
          toast.success("Success", res.data.data.message);
          fetchStatus();
        }
      } catch (err: any) {
        toast.error("Error", err?.response?.data?.message || "Failed to toggle maintenance mode");
      } finally {
        setActionLoading(null);
      }
    });
    setConfirmOpen(true);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    try {
      setActionLoading("notif");
      const res = await AdminAPI.sendGlobalNotification({ title: notifTitle, message: notifMessage, type: notifType });
      if (res.data?.success) {
        toast.success("Success", res.data.data.message);
        setShowNotificationModal(false);
        setNotifTitle("");
        setNotifMessage("");
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to send notification");
    } finally {
      setActionLoading(null);
    }
  };

  const openImpersonateModal = async () => {
    try {
      const res = await AdminAPI.getOrganizations({ limit: 100 });
      if (res.data?.success) {
        setOrganizationsList(res.data.data);
        setShowImpersonateModal(true);
      }
    } catch (err: any) {
      toast.error("Error", "Failed to fetch organizations for impersonation");
    }
  };

  const handleImpersonate = async () => {
    if (!selectedOrgId) return;
    try {
      setActionLoading("impersonate");
      const res = await AdminAPI.impersonateOrg(selectedOrgId);
      if (res.data?.success) {
        toast.success("Success", res.data.data.message);
        setShowImpersonateModal(false);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to impersonate");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCache = async () => {
    try {
      setActionLoading("cache");
      const res = await AdminAPI.clearSystemCache();
      if (res.data?.success) {
        toast.success("Success", res.data.message);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to clear cache");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestartJobs = async () => {
    try {
      setActionLoading("jobs");
      const res = await AdminAPI.restartBackgroundJobs();
      if (res.data?.success) {
        toast.success("Success", res.data.message);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to restart background jobs");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setActionLoading("backup");
      const res = await AdminAPI.backupDatabase();
      if (res.data?.success) {
        const bkp = res.data.data;
        toast.success("Success", `Database Snapshot Created: ${bkp.snapshotId} (${bkp.sizeEstimate}). Summary: ${bkp.summary.organizations} Orgs, ${bkp.summary.users} Users, ${bkp.summary.documents} Docs.`);
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to create database backup");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing Command Center Telemetry...</p>
        </div>
      </div>
    );
  }

  const { platformStatus, activeOrganizationsCard, onlineUsersCard, aiServicesCard, apiHealthCard, criticalAlertsCard, recentAuditLogs } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1 font-semibold flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400 fill-amber-400" />
                Super Admin Exclusive
              </Badge>
              {platformStatus?.maintenanceMode && (
                <Badge className="bg-rose-500 text-white font-bold animate-pulse">
                  MAINTENANCE MODE ACTIVE
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent flex items-center gap-2.5">
              <ShieldAlert className="text-amber-400" size={32} />
              Command Center
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Platform-wide control tower for root configurations, operational status, global actions, and infrastructure telemetry across all multi-tenant organizations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs" onClick={fetchStatus}>
              <RefreshCw size={14} className="mr-1.5" /> Refresh Telemetry
            </Button>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20" onClick={handleToggleMaintenance}>
              <Power size={16} className="mr-1.5" />
              {platformStatus?.maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
            </Button>
          </div>
        </div>
      </div>


      {/* 6 Core Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Platform Status */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <Activity size={16} className="text-emerald-500" /> Platform Status
                </h3>
                <p className="text-xs text-muted-foreground">Core engine runtime</p>
              </div>
            </div>
            <Badge variant={platformStatus?.maintenanceMode ? "destructive" : "default"} className="text-xs">
              {platformStatus?.maintenanceMode ? "Maintenance" : "Operational"}
            </Badge>
          </div>

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">System Uptime:</span>
              <span className="font-mono font-medium">{Math.floor((platformStatus?.uptimeSeconds || 0) / 3600)}h {Math.floor(((platformStatus?.uptimeSeconds || 0) % 3600) / 60)}m</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Memory Heap:</span>
              <span className="font-mono font-medium">{platformStatus?.memoryUsedMB} MB / {platformStatus?.totalMemoryMB} MB</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Node Environment:</span>
              <span className="font-mono uppercase text-xs font-semibold">{platformStatus?.env}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">MongoDB Connection:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected (Ready)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Organizations */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <Building2 size={16} className="text-blue-500" /> Active Organizations
                </h3>
                <p className="text-xs text-muted-foreground">Tenant ecosystem</p>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono">{activeOrganizationsCard?.total || 0}</span>
          </div>

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Active Tenancies:</span>
              <span className="font-semibold text-emerald-600">{activeOrganizationsCard?.active}</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Suspended Orgs:</span>
              <span className="font-semibold text-rose-500">{activeOrganizationsCard?.suspended}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Plan Distribution:</span>
              <div className="flex gap-1.5 text-xs font-mono">
                <Badge variant="outline">Enterprise: {activeOrganizationsCard?.planBreakdown?.enterprise || 0}</Badge>
                <Badge variant="outline">Business: {activeOrganizationsCard?.planBreakdown?.business || 0}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Online Users */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <Users size={16} className="text-purple-500" /> Online Users
                </h3>
                <p className="text-xs text-muted-foreground">User registrations</p>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono">{onlineUsersCard?.total || 0}</span>
          </div>

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Active User Accounts:</span>
              <span className="font-semibold text-emerald-600">{onlineUsersCard?.active}</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Blocked Accounts:</span>
              <span className="font-semibold text-rose-500">{onlineUsersCard?.blocked}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Security Status:</span>
              <span className="text-emerald-600 font-medium text-xs">Auth Policies Enforced</span>
            </div>
          </div>
        </div>

        {/* Card 4: AI Services */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <Bot size={16} className="text-indigo-500" /> AI Services
                </h3>
                <p className="text-xs text-muted-foreground">RAG & LLM Engine</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {aiServicesCard?.activeModel}
            </Badge>
          </div>

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">AI Sessions Count:</span>
              <span className="font-mono font-medium">{aiServicesCard?.totalSessions}</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Total Chat Messages:</span>
              <span className="font-mono font-medium">{aiServicesCard?.totalMessages}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Monthly AI Requests:</span>
              <span className="font-mono font-bold text-indigo-600">{aiServicesCard?.monthlyAiRequests}</span>
            </div>
          </div>
        </div>

        {/* Card 5: API Health */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Wifi size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <Wifi size={16} className="text-cyan-500" /> API Health
                </h3>
                <p className="text-xs text-muted-foreground">Network & latency</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              {apiHealthCard?.expressStatus}
            </Badge>
          </div>

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Database Latency:</span>
              <span className="font-mono font-medium text-emerald-600">{apiHealthCard?.dbPingMs} ms</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Socket Connections:</span>
              <span className="font-mono font-medium">{apiHealthCard?.socketClients} active</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Tenant Storage Allocated:</span>
              <span className="font-mono font-medium">{apiHealthCard?.totalStorageMB} MB</span>
            </div>
          </div>
        </div>

        {/* Card 6: Critical Alerts */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-amber-500" /> Critical Alerts
                </h3>
                <p className="text-xs text-muted-foreground">Action items</p>
              </div>
            </div>
            <Badge variant={criticalAlertsCard?.totalAlerts > 0 ? "destructive" : "secondary"}>
              {criticalAlertsCard?.totalAlerts || 0} Alerts
            </Badge>
          </div>

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Pending Doc Verifications:</span>
              <span className="font-bold text-amber-600">{criticalAlertsCard?.pendingVerifications}</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-white/[0.06]">
              <span className="text-muted-foreground">Blocked Accounts:</span>
              <span className="font-semibold text-rose-500">{criticalAlertsCard?.blockedUsers}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Suspended Orgs:</span>
              <span className="font-semibold text-rose-500">{criticalAlertsCard?.suspendedOrgs}</span>
            </div>
          </div>
        </div>
      </div>



      {/* Quick Actions Panel */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap size={22} className="text-amber-500 fill-amber-500" />
              Quick Actions (Super Admin Only)
            </h2>
            <p className="text-sm text-muted-foreground">Platform-level operations with immediate system-wide effect.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
            onClick={handleToggleMaintenance}
            disabled={actionLoading === "maintenance"}
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Power size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Toggle Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">
                {platformStatus?.maintenanceMode ? "Disable mode" : "Enable mode for maintenance"}
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
            onClick={() => setShowNotificationModal(true)}
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Send Global Notification</p>
              <p className="text-xs text-muted-foreground">Broadcast alert to all registered users</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
            onClick={() => navigate("/superadmin/organizations")}
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <PlusCircle size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Create Organization</p>
              <p className="text-xs text-muted-foreground">Provision new multi-tenant organization</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left"
            onClick={openImpersonateModal}
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Impersonate Organization</p>
              <p className="text-xs text-muted-foreground">View and inspect target tenant context</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
            onClick={handleClearCache}
            disabled={actionLoading === "cache"}
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <RefreshCw size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Clear System Cache</p>
              <p className="text-xs text-muted-foreground">Flush memory state & session buffers</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left"
            onClick={handleRestartJobs}
            disabled={actionLoading === "jobs"}
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Activity size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Restart Background Jobs</p>
              <p className="text-xs text-muted-foreground">Restart cron workers & auto-cleaners</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
            onClick={handleBackupDatabase}
            disabled={actionLoading === "backup"}
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Database size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Backup Database</p>
              <p className="text-xs text-muted-foreground">Create instant database backup snapshot</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:border-slate-500/50 hover:bg-slate-500/5 transition-all text-left"
            onClick={() => navigate("/superadmin/audit-logs")}
          >
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500">
              <ScrollText size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">View Audit Logs</p>
              <p className="text-xs text-muted-foreground">Inspect full platform activity trail</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity Log Stream */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ScrollText size={18} className="text-primary" />
            Recent System Audit Trail
          </h2>
          <Link to="/superadmin/audit-logs" className="text-xs text-primary hover:underline flex items-center gap-1">
            View All Logs <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="divide-y dark:divide-white/[0.04]">
          {recentAuditLogs && recentAuditLogs.length > 0 ? (
            recentAuditLogs.map((log: any) => (
              <div key={log._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    By: {log.user_id?.name || log.user_id?.email || "System"} • Table: <span className="font-mono text-primary">{log.table_name || "N/A"}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/70 font-mono">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">No recent audit activity found.</p>
          )}
        </div>
      </div>

      {/* Modal: Global Notification */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotificationModal(false)}>
          <div className="bg-card rounded-2xl shadow-2xl border max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-white/[0.06]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Megaphone className="text-blue-500" size={20} />
                Send Global Notification
              </h3>
              <button onClick={() => setShowNotificationModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notification Title</label>
                <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Scheduled System Maintenance" required className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notification Type</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border bg-background text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Urgent (Error)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notification Message</label>
                <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="Enter full announcement details for all tenants..." rows={4} required className="mt-1" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNotificationModal(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading === "notif"}>
                  {actionLoading === "notif" ? "Broadcasting..." : "Send Global Broadcast"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Impersonate Organization */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowImpersonateModal(false)}>
          <div className="bg-card rounded-2xl shadow-2xl border max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-white/[0.06]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="text-purple-500" size={20} />
                Impersonate Organization
              </h3>
              <button onClick={() => setShowImpersonateModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select an organization to simulate context and view tenant-level resources:</p>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Target Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-lg border bg-background text-sm"
                >
                  <option value="">-- Choose Organization --</option>
                  {organizationsList.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.organization_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowImpersonateModal(false)}>Cancel</Button>
                <Button onClick={handleImpersonate} disabled={!selectedOrgId || actionLoading === "impersonate"}>
                  {actionLoading === "impersonate" ? "Creating Context..." : "Impersonate Context"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Toggle Maintenance Mode"
        message={confirmMessage}
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}
