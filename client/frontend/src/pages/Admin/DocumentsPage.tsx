import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import DocumentTable from "@/components/admin/DocumentTable";
import DocumentUploadForm from "@/components/admin/DocumentUploadForm";
import { useAdminDocuments } from "@/hooks/useAdminDocuments";
import { useAdminDocumentTypes } from "@/hooks/useAdminDocumentTypes";
import { DocumentAPI } from "@/api";
import { staggerContainer, staggerItem } from "@/lib/animations";

const statusFilters = ["", "pending", "approved", "rejected"];

export default function DocumentsPage() {
  const {
    documents,
    loading,
    fetchDocuments,
    fetchDocumentsByStatus,
    uploadDocument,
    deleteDocument,
  } = useAdminDocuments();

  const { documentTypes, fetchDocumentTypes } = useAdminDocumentTypes();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  useEffect(() => {
    if (statusFilter) {
      fetchDocumentsByStatus(statusFilter);
    } else {
      fetchDocuments();
    }
  }, [statusFilter, fetchDocuments, fetchDocumentsByStatus]);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  const handleUpload = async (formData: FormData) => {
    await uploadDocument(formData);
    if (statusFilter) {
      fetchDocumentsByStatus(statusFilter);
    } else {
      fetchDocuments();
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`Delete document "${doc.title}"?`)) return;
    await deleteDocument(doc._id);
    if (statusFilter) {
      fetchDocumentsByStatus(statusFilter);
    } else {
      fetchDocuments();
    }
  };

  const filtered = documents.filter((doc) =>
    doc.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage all uploaded documents.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus size={16} className="mr-1" />
          Upload Document
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
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
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : (
          <DocumentTable
            documents={filtered}
            onView={setViewingDoc}
            onDelete={handleDelete}
          />
        )}
      </motion.div>

      {showUpload && (
        <DocumentUploadForm
          documentTypes={documentTypes}
          onSubmit={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {viewingDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{viewingDoc.title}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDoc(null)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">
                  {viewingDoc.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {viewingDoc.document_type_id?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded By</span>
                <span className="font-medium">
                  {viewingDoc.user_id?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {viewingDoc.created_at
                    ? new Date(viewingDoc.created_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File</span>
                <span className="font-medium truncate max-w-[200px] text-right">
                  {viewingDoc.file_name || "—"}
                </span>
              </div>
              {viewingDoc.file_size ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">
                    {(viewingDoc.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : null}
              {viewingDoc.file_name && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      const url = await DocumentAPI.getDownloadUrl(viewingDoc._id);
                      window.open(url, '_blank');
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Download {viewingDoc.file_name}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
