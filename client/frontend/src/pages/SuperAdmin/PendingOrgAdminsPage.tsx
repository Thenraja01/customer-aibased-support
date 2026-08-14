import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAPI } from "@/api/auth.api";
import { useToast } from "@/components/ui/toast";

interface PendingAdmin {
  _id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  organization_id: { _id: string; name: string; organization_id: string; email: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function PendingOrgAdminsPage() {
  const toast = useToast();

  const [admins, setAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AuthAPI.getPendingRegistrations();
      setAdmins(res.data.data || []);
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to load pending org admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await AuthAPI.approveRegistration(id, { action: "approve" });
      toast.success("Approved", "Org admin has been approved");
      setAdmins((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await AuthAPI.approveRegistration(id, { action: "reject", rejection_reason: rejectionReason });
      toast.success("Rejected", "Org admin registration has been rejected");
      setAdmins((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
      setRejectionReason("");
    }
  };

  const filtered = admins.filter((a) =>
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.organization_id?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold ">Pending Org Admins</h1>
          <p className="text-muted-foreground text-sm">Review and approve/reject organization admin registrations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or org name..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users size={40} className="mb-3 opacity-50" />
          <p className="text-lg font-medium">No pending org admins</p>
          <p className="text-sm">All org admin registrations have been processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((admin) => (
              <motion.div
                key={admin._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-xl border bg-card p-4 sm:p-5 dark:border-white/[0.06]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-500 shrink-0" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Pending Approval
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-muted-foreground shrink-0" />
                      <span className="font-medium">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 size={14} className="shrink-0" />
                      <span>{admin.organization_id?.name || "N/A"}</span>
                      {admin.organization_id?.organization_id && (
                        <span className="text-xs text-muted-foreground/70">
                          ({admin.organization_id.organization_id})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registered {formatDate(admin.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={actionLoading === admin._id}
                      onClick={() => setConfirmAction({ id: admin._id, action: "approve" })}
                    >
                      {actionLoading === admin._id ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : (
                        <CheckCircle size={14} className="mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === admin._id}
                      onClick={() => setConfirmAction({ id: admin._id, action: "reject" })}
                    >
                      <XCircle size={14} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => { setConfirmAction(null); setRejectionReason(""); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card rounded-xl shadow-2xl border max-w-md w-full p-6 dark:border-white/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              {confirmAction.action === "approve" ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Approve Org Admin</h3>
                      <p className="text-sm text-muted-foreground">
                        This will activate the admin account for the organization.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setConfirmAction(null); setRejectionReason(""); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={actionLoading === confirmAction.id}
                      onClick={() => handleApprove(confirmAction.id)}
                    >
                      {actionLoading === confirmAction.id ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : null}
                      Confirm Approve
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <XCircle size={20} className="text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Reject Org Admin</h3>
                      <p className="text-sm text-muted-foreground">
                        This will block the admin registration.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      rows={3}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:border-white/[0.06]"
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setConfirmAction(null); setRejectionReason(""); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={actionLoading === confirmAction.id}
                        onClick={() => handleReject(confirmAction.id)}
                      >
                        {actionLoading === confirmAction.id ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : null}
                        Confirm Reject
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}