import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Shield,
  User,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AuthAPI } from "@/api/auth.api";
import { useToast } from "@/components/ui/toast";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  created_at: string;
  organization_id: { _id: string; name: string };
  role_id: { _id: string; role_name: string; description?: string };
  status: "pending" | "approved" | "blocked" | "active";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function UserDetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0 dark:border-white/[0.05]">
      <div className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function PendingApprovalsPage() {
  const toast = useToast();

  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AuthAPI.getPendingRegistrations();
      setUsers(res.data.data || []);
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to load pending registrations.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.organization_id?.name?.toLowerCase().includes(q) ||
      u.role_id?.role_name?.toLowerCase().includes(q)
    );
  });

  const handleAction = useCallback(
    async (userId: string, action: "approve" | "reject", reason?: string) => {
      setActionLoading(userId);
      try {
        const res = await AuthAPI.approveRegistration(userId, {
          action,
          rejection_reason: reason,
        });

        if (action === "approve") {
          const otpSent = res.data.data?.otpSent;
          toast.success(
            "User Approved!",
            otpSent
              ? "OTP verification email sent to the user."
              : "User approved, but OTP email failed. Ask the user to request a new OTP."
          );
        } else {
          toast.success("Registration Rejected", "The user has been notified.");
        }

        // Remove from list
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setSelectedUser(null);
        setRejectionReason("");
        setShowRejectInput(false);
        setBulkSelected((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } catch (err: any) {
        toast.error("Action Failed", err.response?.data?.message || "Something went wrong.");
      } finally {
        setActionLoading(null);
      }
    },
    [toast]
  );

  const handleBulkApprove = useCallback(async () => {
    if (bulkSelected.size === 0) return;
    setBulkLoading(true);
    let successCount = 0;
    for (const userId of bulkSelected) {
      try {
        await AuthAPI.approveRegistration(userId, { action: "approve" });
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        successCount++;
      } catch {
        // continue with others
      }
    }
    setBulkSelected(new Set());
    setBulkLoading(false);
    toast.success("Bulk Approved", `${successCount} user(s) approved and OTP emails sent.`);
  }, [bulkSelected, toast]);

  const toggleBulkSelect = useCallback((userId: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (bulkSelected.size === filteredUsers.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filteredUsers.map((u) => u._id)));
    }
  }, [bulkSelected, filteredUsers]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500" />
            Pending Approvals
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and approve new registration requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bulkSelected.size > 0 && (
            <Button
              onClick={handleBulkApprove}
              disabled={bulkLoading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {bulkLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              )}
              Approve {bulkSelected.size} Selected
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading} className="dark:border-white/[0.08]">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border dark:border-white/[0.06] shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-400/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border dark:border-white/[0.06] shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredUsers.length}</p>
              <p className="text-xs text-muted-foreground">Filtered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border dark:border-white/[0.06] shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-400/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bulkSelected.size}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, org, role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 dark:border-white/[0.08]"
        />
      </div>

      {/* Table */}
      <Card className="border dark:border-white/[0.06] shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] hidden sm:grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
          <input
            type="checkbox"
            checked={bulkSelected.size === filteredUsers.length && filteredUsers.length > 0}
            onChange={selectAll}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organization</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading registrations…</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="font-medium">
                {search ? "No results match your search." : "No pending registrations."}
              </p>
              {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y dark:divide-white/[0.05]">
              <AnimatePresence initial={false}>
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`px-4 py-4 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-colors ${
                      bulkSelected.has(user._id) ? "bg-primary/5 dark:bg-primary/5" : ""
                    }`}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={bulkSelected.has(user._id)}
                          onChange={() => toggleBulkSelect(user._id)}
                          className="h-4 w-4 accent-primary mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted border dark:border-white/[0.06]">
                              {user.organization_id?.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted border dark:border-white/[0.06]">
                              {user.role_id?.role_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-7">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                          className="h-8 px-3 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(user._id, "approve")}
                          disabled={actionLoading === user._id}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedUser(user); setShowRejectInput(true); }}
                          disabled={actionLoading === user._id}
                          className="h-8 px-3 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(user._id)}
                        onChange={() => toggleBulkSelect(user._id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                      <p className="text-sm truncate text-muted-foreground">{user.email}</p>
                      <p className="text-sm truncate">{user.organization_id?.name || "—"}</p>
                      <p className="text-sm truncate capitalize">{user.role_id?.role_name || "—"}</p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                          className="h-8 w-8 p-0"
                          title="Review Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(user._id, "approve")}
                          disabled={actionLoading === user._id}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedUser(user); setShowRejectInput(true); }}
                          disabled={actionLoading === user._id}
                          className="h-8 px-3 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 dark:border-destructive/30"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review / Reject Dialog */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedUser(null);
                setShowRejectInput(false);
                setRejectionReason("");
              }}
            />
            {/* Dialog */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="w-full max-w-md shadow-2xl border dark:border-white/[0.08] bg-card">
                <CardHeader className="pb-4 px-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                      <CardDescription>Registration Review</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="rounded-xl border dark:border-white/[0.06] divide-y dark:divide-white/[0.05] overflow-hidden">
                    <UserDetailRow icon={<Mail />} label="Email" value={selectedUser.email} />
                    <UserDetailRow icon={<Phone />} label="Phone" value={selectedUser.phone} />
                    <UserDetailRow
                      icon={<Calendar />}
                      label="Date of Birth"
                      value={selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString("en-IN") : undefined}
                    />
                    <UserDetailRow
                      icon={<Building2 />}
                      label="Organization"
                      value={selectedUser.organization_id?.name}
                    />
                    <UserDetailRow
                      icon={<Briefcase />}
                      label="Role"
                      value={selectedUser.role_id?.role_name}
                    />
                    <UserDetailRow
                      icon={<Clock />}
                      label="Applied On"
                      value={formatDate(selectedUser.created_at)}
                    />
                  </div>

                  {/* Reject reason input */}
                  <AnimatePresence>
                    {showRejectInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <Label htmlFor="rejection_reason" className="flex items-center gap-1.5 text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Rejection Reason
                        </Label>
                        <textarea
                          id="rejection_reason"
                          rows={3}
                          placeholder="Provide a reason for rejection (optional but recommended)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm bg-background dark:border-white/[0.08] dark:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 dark:border-white/[0.08]"
                      onClick={() => {
                        setSelectedUser(null);
                        setShowRejectInput(false);
                        setRejectionReason("");
                      }}
                    >
                      Cancel
                    </Button>

                    {!showRejectInput ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10 dark:border-destructive/30"
                          onClick={() => setShowRejectInput(true)}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleAction(selectedUser._id, "approve")}
                          disabled={actionLoading === selectedUser._id}
                        >
                          {actionLoading === selectedUser._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1.5" /> Approve</>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleAction(selectedUser._id, "reject", rejectionReason)}
                        disabled={actionLoading === selectedUser._id}
                      >
                        {actionLoading === selectedUser._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><XCircle className="h-4 w-4 mr-1.5" /> Confirm Rejection</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
