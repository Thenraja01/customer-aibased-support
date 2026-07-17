import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import DocumentVerificationTable from "@/components/admin/DocumentVerificationTable";
import { useAdminDocumentVerifications } from "@/hooks/useAdminDocumentVerifications";
import { staggerContainer, staggerItem } from "@/lib/animations";

const statusFilters = ["", "pending", "approved", "rejected"];

export default function DocumentVerificationsPage() {
  const {
    documentVerifications,
    loading,
    fetchVerifications,
    fetchVerificationsByStatus,
    approveVerification,
    rejectVerification,
    deleteVerification,
  } = useAdminDocumentVerifications();

  const [statusFilter, setStatusFilter] = useState("");
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  useEffect(() => {
    if (statusFilter) {
      fetchVerificationsByStatus(statusFilter);
    } else {
      fetchVerifications();
    }
  }, [statusFilter, fetchVerifications, fetchVerificationsByStatus]);

  const handleApprove = async (v: any) => {
    if (!confirm("Approve this verification?")) return;
    await approveVerification(v._id);
    if (statusFilter) {
      fetchVerificationsByStatus(statusFilter);
    } else {
      fetchVerifications();
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await rejectVerification(rejectTarget._id, rejectRemarks);
    setRejectTarget(null);
    setRejectRemarks("");
    if (statusFilter) {
      fetchVerificationsByStatus(statusFilter);
    } else {
      fetchVerifications();
    }
  };

  const handleDelete = async (v: any) => {
    if (!confirm("Delete this verification?")) return;
    await deleteVerification(v._id);
    if (statusFilter) {
      fetchVerificationsByStatus(statusFilter);
    } else {
      fetchVerifications();
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem}>
        <h1 className="text-3xl font-bold tracking-tight">
          Document Verifications
        </h1>
        <p className="text-muted-foreground">
          Review and manage document verifications.
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
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
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : (
          <DocumentVerificationTable
            verifications={documentVerifications}
            onApprove={handleApprove}
            onReject={setRejectTarget}
            onDelete={handleDelete}
          />
        )}
      </motion.div>

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
    </motion.div>
  );
}
