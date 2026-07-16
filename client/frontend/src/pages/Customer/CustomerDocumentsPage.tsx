import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DocumentAPI } from "@/api";
import { Upload, FileText, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import type { IDocument } from "@/types";

export default function CustomerDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user?._id) return;
    try {
      const res = await DocumentAPI.getAll();
      if (res.data.success) {
        const userDocs = res.data.data.filter((doc: IDocument) => doc.user_id === user._id);
        setDocuments(userDocs);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setTitle(e.target.files[0].name);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user?._id || !user?.organization_id?._id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("user_id", user._id);
      formData.append("organization_id", user.organization_id._id);

      const res = await DocumentAPI.upload(formData);
      if (res.data.success) {
        setDocuments([res.data.data, ...documents]);
        setSelectedFile(null);
        setTitle("");
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "rejected":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload and view your KYC documents and other files.
        </p>
      </div>

      {/* Upload Form */}
      <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6">
        <h3 className="text-sm font-medium mb-4">Upload New Document</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter document title"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">File</label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-white/[0.06]">
          <h3 className="text-sm font-medium">Your Documents</h3>
        </div>
        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {documents.map((doc) => (
              <div key={doc._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(doc.status)}`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </span>
                  </span>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Eye size={16} className="text-muted-foreground" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
