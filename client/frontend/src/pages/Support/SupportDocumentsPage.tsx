import { useState, useEffect } from "react";
import { FileText, Search, Download } from "lucide-react";
import { DocumentAPI } from "@/api";

export default function SupportDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    DocumentAPI.getAll({}).then((res) => {
      if (res.data.success) setDocuments(res.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = documents.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.title?.toLowerCase().includes(q) || d.file_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const url = await DocumentAPI.resolveDocumentUrl(docId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to resolve document URL:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold ">Documents</h1>
        <p className="text-sm text-muted-foreground">Browse knowledge base documents</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No documents found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <div key={doc._id} className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/5">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.title || doc.file_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
              {doc.user_id?.name && (
                <p className="text-[10px] text-muted-foreground">Uploaded by {doc.user_id.name}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownload(doc._id)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
