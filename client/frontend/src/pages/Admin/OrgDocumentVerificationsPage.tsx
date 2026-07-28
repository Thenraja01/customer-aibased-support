import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import DocumentVerificationTable from "@/components/admin/DocumentVerificationTable";
import DocumentVerificationAPI from "@/api/documentVerification.api";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const statusFilters = ["", "pending", "approved", "rejected"];

export default function OrgDocumentVerificationsPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id?._id;

  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const fetchVerifications = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await DocumentVerificationAPI.getAll({ organization_id: orgId });
      if (res.data.success) {
        setVerifications(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch verifications", error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchVerificationsByStatus = useCallback(async (status: string) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await DocumentVerificationAPI.getByStatus(status, { organization_id: orgId });
      if (res.data.success) {
        setVerifications(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch verifications by status", error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (statusFilter) {
      fetchVerificationsByStatus(statusFilter);
    } else {
      fetchVerifications();
    }
  }, [statusFilter, fetchVerifications, fetchVerificationsByStatus]);

  const handleApprove = async (v: any) => {
    setConfirmAction(() => async () => {
      await DocumentVerificationAPI.approve(v._id);
      if (statusFilter) {
        fetchVerificationsByStatus(statusFilter);
      } else {
        fetchVerifications();
      }
    });
    setConfirmOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await DocumentVerificationAPI.reject(rejectTarget._id, rejectRemarks);
    setRejectTarget(null);
    setRejectRemarks("");
    if (statusFilter) {
      fetchVerificationsByStatus(statusFilter);
    } else {
      fetchVerifications();
    }
  };

  const handleDelete = async (v: any) => {
    setConfirmAction(() => async () => {
      await DocumentVerificationAPI.remove(v._id);
      if (statusFilter) {
        fetchVerificationsByStatus(statusFilter);
      } else {
        fetchVerifications();
      }
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Document Verifications
        </h1>
        <p className="text-muted-foreground">
          Review and manage document verifications for your organization.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {statusFilters.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s || "All"}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : (
          <DocumentVerificationTable
            verifications={verifications}
            onApprove={handleApprove}
            onReject={setRejectTarget}
            onDelete={handleDelete}
          />
        )}
      </div>

      {rejectTarget && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reject Verification</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectRemarks("");
                }}
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectRemarks("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectRemarks}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Action"
        message="Are you sure you want to perform this action?"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}
