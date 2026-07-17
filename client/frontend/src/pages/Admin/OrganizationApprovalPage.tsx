import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  AlertCircle,
  Eye,
} from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { AdminAPI } from "@/api";



interface PendingOrg {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  description?: string;
  website?: string;
  industry?: string;
  rejectReason?: string;
}

export default function OrganizationApprovalPage() {
  const [orgs, setOrgs] = useState<PendingOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedOrg, setSelectedOrg] = useState<PendingOrg | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrgs();
  }, [statusFilter]);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await AdminAPI.getOrganizations(params);
      if (res.data.success) {
        setOrgs(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return orgs.filter(
      (o) =>
        o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orgs, search]);

  const stats = useMemo(() => {
    const pending = orgs.filter((o) => o.status === "pending").length;
    const approved = orgs.filter((o) => o.status === "approved").length;
    const rejected = orgs.filter((o) => o.status === "rejected").length;
    return { pending, approved, rejected };
  }, [orgs]);

  const handleAction = async () => {
    if (!selectedOrg || !actionType) return;
    setProcessing(true);
    try {
      if (actionType === "approve") {
        await AdminAPI.updateOrganization(selectedOrg._id, { status: "approved" });
      } else {
        await AdminAPI.updateOrganization(selectedOrg._id, {
          status: "rejected",
          rejectReason: remark || undefined,
        });
      }
      loadOrgs();
    } catch (error) {
      console.error("Failed to process organization:", error);
    } finally {
      setProcessing(false);
      setSelectedOrg(null);
      setActionType(null);
      setRemark("");
    }
  };

  const openAction = (org: PendingOrg, type: "approve" | "reject") => {
    setSelectedOrg(org);
    setActionType(type);
    setRemark("");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Approvals</h1>
          <p className="text-muted-foreground">Review and approve pending organization registrations.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrgs}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-3">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-2">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold mt-2">{stats.approved}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold mt-2">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-destructive/10 dark:bg-destructive/15 flex items-center justify-center">
              <XCircle size={20} className="text-destructive" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading organizations...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Building2 size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">No organizations found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        {org.industry && (
                          <p className="text-xs text-muted-foreground">{org.industry}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail size={12} className="text-muted-foreground" />
                          {org.email}
                        </div>
                        {org.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone size={10} />
                            {org.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin size={10} />
                          <span className="max-w-[150px] truncate">{org.address}</span>
                        </div>
                      )}
                      {org.website && (
                        <p className="text-xs text-primary">{org.website}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar size={12} />
                        {org.created_at
                          ? new Date(org.created_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          org.status === "approved"
                            ? "default"
                            : org.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {org.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openAction(org, "approve")}
                          >
                            <CheckCircle2 size={14} className="mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openAction(org, "reject")}
                          >
                            <XCircle size={14} className="mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrg(org)}
                        >
                          <Eye size={14} /> View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <Dialog
        open={!!selectedOrg && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrg(null);
            setActionType(null);
            setRemark("");
          }
        }}
      >
        <DialogContent className="dark:bg-card dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Organization
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Approve "${selectedOrg?.name}" and grant them platform access?`
                : `Reject "${selectedOrg?.name}". They will not be able to access the platform.`}
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" />
                <span className="font-medium">{selectedOrg.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span>{selectedOrg.email}</span>
              </div>
              {selectedOrg.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <span>{selectedOrg.phone}</span>
                </div>
              )}
              {selectedOrg.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span>{selectedOrg.address}</span>
                </div>
              )}
            </div>
          )}

          {actionType === "reject" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason (optional)</label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
          )}

          {actionType === "approve" && (
            <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground dark:border-white/[0.06]">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" />
              <p>
                The organization will receive a notification and their account will be activated with
                Starter plan defaults.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOrg(null);
                setActionType(null);
                setRemark("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing
                ? "Processing..."
                : actionType === "approve"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedOrg && !actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrg(null);
            setRemark("");
          }
        }}
      >
        <DialogContent className="dark:bg-card dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
            <DialogDescription>Organization details</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOrg.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOrg.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-medium">{selectedOrg.industry || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedOrg.status === "approved" ? "default" : "destructive"} className="capitalize">
                    {selectedOrg.status}
                  </Badge>
                </div>
              </div>
              {selectedOrg.address && (
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedOrg.address}</p>
                </div>
              )}
              {selectedOrg.website && (
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <p className="font-medium text-primary">{selectedOrg.website}</p>
                </div>
              )}
              {selectedOrg.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedOrg.description}</p>
                </div>
              )}
              {selectedOrg.rejectReason && (
                <div className="rounded-lg border p-3 bg-destructive/5">
                  <p className="text-xs text-destructive font-medium mb-1">Rejection Reason</p>
                  <p className="text-sm">{selectedOrg.rejectReason}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="font-medium">
                  {selectedOrg.created_at
                    ? new Date(selectedOrg.created_at).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrg(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
