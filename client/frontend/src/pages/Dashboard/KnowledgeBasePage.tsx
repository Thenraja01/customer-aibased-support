import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Trash2, Loader2, Database, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import DocumentAPI from "@/api/document.api.js";

interface DocumentDoc {
  _id: string;
  original_name?: string;
  title?: string;
  status: string;
  knowledge_index_status?: string;
  file_size?: number;
  size_bytes?: number;
  created_at?: string;
  createdAt?: string;
}

export default function KnowledgeBasePage() {
  const toast = useToast();
  const [documents, setDocuments] = useState<DocumentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await DocumentAPI.getAll();
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to load knowledge base documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name);

      await DocumentAPI.upload(formData);
      toast.success("Document Uploaded", "Document processing initiated. Your knowledge base is updating.");
      setSelectedFile(null);
      loadDocuments();
    } catch (err: any) {
      toast.error("Upload Error", err?.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DocumentAPI.delete(id);
      toast.success("Document Deleted", "Document removed from knowledge base.");
      loadDocuments();
    } catch {
      toast.error("Error", "Failed to delete document.");
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await DocumentAPI.reprocess(id);
      toast.success("Reprocessing Initiated", "Re-indexing document into knowledge base.");
      loadDocuments();
    } catch {
      toast.error("Error", "Failed to reprocess document.");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDocReady = (d: DocumentDoc) => {
    const readyValues = ["indexed", "ready_for_review", "published", "approved", "completed", "ready"];
    return readyValues.includes(d.knowledge_index_status || "") || readyValues.includes(d.status || "");
  };

  const isDocFailed = (d: DocumentDoc) => {
    return d.knowledge_index_status === "failed" || d.status === "failed" || d.status === "rejected";
  };

  const readyDocs = documents.filter(isDocReady);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your policies, guides, and manuals so your AI assistant can answer customer queries accurately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-semibold text-xs border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck size={16} />
            Knowledge Ready ({readyDocs.length}/{documents.length} Docs)
          </span>
        </div>
      </div>

      {/* Upload Document Box */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Upload className="text-primary" size={18} />
          Upload New Knowledge Base Document
        </h3>

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.doc"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="flex-1 text-xs border rounded-xl p-2.5 bg-background cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Processing..." : "Upload & Index Document"}
          </button>
        </form>
      </div>

      {/* Document List Table */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Database className="text-primary" size={18} />
            Uploaded Documents ({documents.length})
          </h3>
          <button
            type="button"
            onClick={loadDocuments}
            className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <Loader2 size={16} className="animate-spin text-primary" />
            Loading knowledge base documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-muted/20">
            <FileText size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No Documents Uploaded</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your company policies or FAQs to train your AI support assistant.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Document Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">File Size</th>
                  <th className="px-4 py-3">Uploaded Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => {
                  const isReady = isDocReady(doc);
                  const isFailed = isDocFailed(doc);

                  return (
                    <tr key={doc._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                        <FileText size={16} className="text-primary shrink-0" />
                        <span className="truncate max-w-[240px]">📄 {doc.original_name || doc.title || "Document.pdf"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isReady
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : isFailed
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                          }`}
                        >
                          {isReady ? <CheckCircle2 size={12} /> : isFailed ? <AlertCircle size={12} /> : <Loader2 size={12} className="animate-spin" />}
                          {isReady ? "Ready" : isFailed ? "Failed" : "Processing"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatFileSize(doc.file_size || doc.size_bytes)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(doc.created_at || doc.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleReprocess(doc._id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Reprocess Document"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc._id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
