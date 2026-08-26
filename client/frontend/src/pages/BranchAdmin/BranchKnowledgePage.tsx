import React, { useState, useEffect } from "react";
import { 
  BookOpen, Upload, CheckCircle2, AlertTriangle, 
  Search, Filter, RefreshCw, FileText, Cpu, Trash2, ShieldCheck, X
} from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function BranchKnowledgePage() {
  const toast = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["customer", "support", "branch_admin", "admin"]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get(`/documents?status=${statusFilter}`);
      if (res.data?.success) {
        setDocuments(res.data.data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("description", description);
    formData.append("allowed_roles", JSON.stringify(allowedRoles));

    try {
      await AxiosInstance.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess("Document uploaded successfully! Verification & RAG indexing initiated.");
      setFile(null);
      setTitle("");
      setDescription("");
      fetchDocuments();
      setTimeout(() => setShowUploadModal(false), 1500);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleApproveDocument = async (id: string) => {
    try {
      await AxiosInstance.patch(`/documents/${id}/approve`);
      await AxiosInstance.patch(`/documents/${id}/publish`);
      toast.success("Document Approved", "Document approved and published.");
      fetchDocuments();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to approve/publish document");
    }
  };

  const handleRetryIngestion = async (id: string) => {
    try {
      await AxiosInstance.post(`/documents/${id}/retry-ingestion`);
      toast.info("Ingestion Triggered", "Retrying document ingestion.");
      fetchDocuments();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to retry document ingestion");
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteId) return;
    try {
      await AxiosInstance.delete(`/documents/${deleteId}`);
      toast.success("Deleted", "Document deleted from branch knowledge base.");
      setDeleteId(null);
      fetchDocuments();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to delete document");
    }
  };

  const toggleAllowedRole = (role: string) => {
    setAllowedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(search.toLowerCase()) ||
    doc.file_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch RAG Knowledge Base & Documents</h1>
          <p className="text-slate-400 text-sm mt-1">Upload branch documents, monitor ChromaDB vector indexing, and manage document verification approvals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDocuments}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search branch knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="published">Published & Grounded</option>
            <option value="approved">Approved</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="uploaded">Uploaded / Processing</option>
          </select>
        </div>
      </div>

      {/* Documents Table / Grid */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Branch Index Documents ({filteredDocs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Document Title</th>
                <th className="px-6 py-4">Verification Status</th>
                <th className="px-6 py-4">RAG Index Status</th>
                <th className="px-6 py-4">Access Roles</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading branch knowledge documents...</td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No documents found matching current filter.</td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-slate-100 font-semibold">{doc.title || doc.file_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{doc.file_name} • {(doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) : "1.2")} MB</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        doc.status === "published" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        doc.status === "approved" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                        doc.status === "ready_for_review" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {doc.status || "uploaded"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        <span className={`text-xs font-semibold ${
                          doc.knowledge_index_status === "indexed" || doc.ingestionStatus === "completed" ? "text-emerald-400" :
                          doc.knowledge_index_status === "failed" ? "text-rose-400" : "text-amber-400"
                        }`}>
                          {doc.knowledge_index_status || doc.ingestionStatus || "queued"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(doc.allowed_roles || ["all"]).map((role: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(doc.status === "ready_for_review" || doc.status === "uploaded") && (
                          <button
                            onClick={() => handleApproveDocument(doc._id)}
                            className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg border border-emerald-500/30 transition"
                            title="Approve & Publish for Branch"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        {(doc.knowledge_index_status === "failed" || doc.ingestionStatus === "failed") && (
                          <button
                            onClick={() => handleRetryIngestion(doc._id)}
                            className="p-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded-lg border border-amber-500/30 transition"
                            title="Retry RAG Indexing"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg border border-rose-500/30 transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" /> Upload Branch Document
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {uploadSuccess}
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Select File (PDF, DOCX, TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Branch Refund & Cancellation Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description / Summary</label>
                <textarea
                  placeholder="Brief summary of document contents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-2">Allowed Target Roles (RAG Search Scope)</label>
                <div className="flex flex-wrap gap-2">
                  {["customer", "support", "branch_admin", "admin"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleAllowedRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        allowedRoles.includes(role)
                          ? "bg-indigo-600/30 border-indigo-400 text-indigo-200"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {allowedRoles.includes(role) ? "✓ " : ""}{role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Knowledge Document"
        message="Are you sure you want to delete this document from the branch knowledge base? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteDocument}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
