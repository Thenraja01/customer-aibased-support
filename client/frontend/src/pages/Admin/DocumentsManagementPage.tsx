import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import DocumentTable from "@/components/admin/DocumentTable";
import DocumentUploadForm from "@/components/admin/DocumentUploadForm";
import DocumentVerificationTable from "@/components/admin/DocumentVerificationTable";
import DocumentAPI from "@/api/document.api";
import DocumentVerificationAPI from "@/api/documentVerification.api";
import DocumentTypeAPI from "@/api/documentType.api";
import { AdminAPI } from "@/api/admin.api";
import { useAuth } from "@/hooks/useAuth";

const statusFilters = ["", "draft", "pending", "approved", "rejected"];

export default function DocumentsManagementPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id?._id;

  const [documents, setDocuments] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectDocTarget, setRejectDocTarget] = useState<any>(null);
  const [rejectDocRemarks, setRejectDocRemarks] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await DocumentAPI.getAll({ organization_id: orgId });
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchDocumentsByStatus = useCallback(async (status: string) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await DocumentAPI.getByStatus(status, { organization_id: orgId });
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch documents by status", error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchVerifications = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await DocumentVerificationAPI.getAll({ organization_id: orgId });
      if (res.data.success) {
        setVerifications(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch verifications", error);
    }
  }, [orgId]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const res = await DocumentTypeAPI.getAll();
      if (res.data.success) {
        setDocumentTypes(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch document types", error);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await AdminAPI.getRoles({ limit: 100 });
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  }, []);

  useEffect(() => {
    if (statusFilter) {
      fetchDocumentsByStatus(statusFilter);
    } else {
      fetchDocuments();
    }
  }, [statusFilter, fetchDocuments, fetchDocumentsByStatus]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleUpload = async (formData: FormData) => {
    if (orgId) {
      formData.append("organization_id", orgId);
    }
    await DocumentAPI.upload(formData);
    fetchDocuments();
    fetchVerifications();
  };

  const handleApprove = async (doc: any) => {
    if (!confirm(`Approve document "${doc.title}"?`)) return;
    await DocumentAPI.approve(doc._id);
    fetchDocuments();
    fetchVerifications();
  };

  const handleRejectDoc = async () => {
    if (!rejectDocTarget) return;
    await DocumentAPI.reject(rejectDocTarget._id, rejectDocRemarks);
    setRejectDocTarget(null);
    setRejectDocRemarks("");
    fetchDocuments();
    fetchVerifications();
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`Delete document "${doc.title}"?`)) return;
    await DocumentAPI.remove(doc._id);
    fetchDocuments();
    fetchVerifications();
  };

  const handleApproveVerification = async (v: any) => {
    if (!confirm("Approve this verification?")) return;
    await DocumentVerificationAPI.approve(v._id);
    fetchVerifications();
    fetchDocuments();
  };

  const handleRejectVerification = async () => {
    if (!rejectTarget) return;
    await DocumentVerificationAPI.reject(rejectTarget._id, rejectRemarks);
    setRejectTarget(null);
    setRejectRemarks("");
    fetchVerifications();
    fetchDocuments();
  };

  const handleDeleteVerification = async (v: any) => {
    if (!confirm("Delete this verification?")) return;
    await DocumentVerificationAPI.remove(v._id);
    fetchVerifications();
  };

  const filtered = documents.filter((doc) =>
    doc.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage documents and verifications.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus size={16} className="mr-1" />
          Upload Document
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-9"
          />
        </div>
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
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <DocumentTable
            documents={filtered}
            onView={setViewingDoc}
            onApprove={handleApprove}
            onReject={setRejectDocTarget}
            onDelete={handleDelete}
          />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-3">
          Verifications
        </h2>
        <div className="rounded-xl border bg-card">
          <DocumentVerificationTable
            verifications={verifications}
            onApprove={handleApproveVerification}
            onReject={setRejectTarget}
            onDelete={handleDeleteVerification}
          />
        </div>
      </div>

      {showUpload && (
        <DocumentUploadForm
          documentTypes={documentTypes}
          roles={roles}
          onSubmit={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {viewingDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{viewingDoc.title}</h2>
              <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>
                Close
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{viewingDoc.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Role</span>
                <span className="font-medium">{viewingDoc.assigned_role || "All"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{viewingDoc.document_type_id?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded By</span>
                <span className="font-medium">{viewingDoc.user_id?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {viewingDoc.created_at ? new Date(viewingDoc.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
              {viewingDoc.file_url && (
                <div className="pt-2">
                  <a href={viewingDoc.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reject Verification</h2>
              <Button variant="ghost" size="sm" onClick={() => { setRejectTarget(null); setRejectRemarks(""); }}>
                <Plus size={16} className="rotate-45" />
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
                <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectRemarks(""); }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRejectVerification} disabled={!rejectRemarks}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectDocTarget && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reject Document</h2>
              <Button variant="ghost" size="sm" onClick={() => { setRejectDocTarget(null); setRejectDocRemarks(""); }}>
                <Plus size={16} className="rotate-45" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <textarea
                  value={rejectDocRemarks}
                  onChange={(e) => setRejectDocRemarks(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectDocTarget(null); setRejectDocRemarks(""); }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRejectDoc} disabled={!rejectDocRemarks}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
