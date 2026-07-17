import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { DocumentAPI } from "@/api";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Search,
  Grid3X3,
  List,
  Download,
  X,
  CloudUpload,
} from "lucide-react";
import type { IDocument } from "@/types";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function CustomerDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [previewDoc, setPreviewDoc] = useState<IDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user?._id) return;
    try {
      const res = await DocumentAPI.getAll();
      if (res.data.success) {
        const userDocs = res.data.data.filter(
          (doc: IDocument) => doc.user_id === user._id
        );
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      const f = e.dataTransfer.files[0];
      setSelectedFile(f);
      setTitle(f.name);
    }
  }, []);

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

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={14} className="text-green-500" />;
      case "pending":
        return <Clock size={14} className="text-yellow-500" />;
      case "rejected":
        return <XCircle size={14} className="text-red-500" />;
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
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <motion.div variants={staggerItem} className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">My Documents</h1>
          <p className="text-sm text-muted-foreground">
            Upload and view your KYC documents and other files.
          </p>
        </motion.div>

        {/* Upload Form with Drag-and-Drop */}
        <motion.div
          variants={staggerItem}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6"
        >
          <h3 className="text-sm font-medium mb-4">Upload New Document</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter document title"
                required
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => document.getElementById("doc-file-input")?.click()}
              className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {selectedFile ? (
                <>
                  <FileText size={24} className="text-primary" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Click or drop to replace
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload
                    size={24}
                    className={`${
                      isDragging ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p className="text-sm text-muted-foreground">
                    {isDragging
                      ? "Drop file here..."
                      : "Drag & drop a file or click to browse"}
                  </p>
                </>
              )}
              <input
                id="doc-file-input"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Upload size={16} />
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </motion.div>

        {/* Search & View Toggle */}
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name or status..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg border bg-background">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Grid3X3 size={18} />
            </button>
          </div>
        </motion.div>

        {/* Documents */}
        <motion.div
          variants={staggerItem}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden"
        >
          <div className="px-6 py-4 border-b dark:border-white/[0.06]">
            <h3 className="text-sm font-medium">
              Your Documents ({filteredDocuments.length})
            </h3>
          </div>
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <FileText
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No documents match your search."
                  : "No documents uploaded yet."}
              </p>
            </div>
          ) : viewMode === "list" ? (
            <div className="divide-y dark:divide-white/[0.04]">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
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
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(
                        doc.status
                      )}`}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </span>
                    </span>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Eye size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc._id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border dark:border-white/[0.06] bg-background p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(
                        doc.status
                      )}`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate mb-1">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.created_at || "").toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border dark:border-white/[0.06] shadow-2xl w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b dark:border-white/[0.06]">
                <h3 className="text-lg font-semibold">Document Details</h3>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mx-auto">
                  <FileText size={28} className="text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-lg">{previewDoc.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uploaded on{" "}
                    {new Date(previewDoc.created_at || "").toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span
                      className={`text-sm font-medium inline-flex items-center gap-1 mt-1 ${getStatusColor(
                        previewDoc.status
                      )} px-2 py-0.5 rounded-md`}
                    >
                      {getStatusIcon(previewDoc.status)}
                      {previewDoc.status}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium mt-1">
                      {previewDoc.file_url?.split(".").pop()?.toUpperCase() ||
                        "FILE"}
                    </p>
                  </div>
                </div>
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Download size={16} />
                  Download File
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
