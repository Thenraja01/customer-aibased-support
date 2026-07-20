import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  X,
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  CloudUpload,
} from "lucide-react";

interface FileWithPreview extends File {
  preview?: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf") return FileText;
  return File;
}

export default function DocumentUploadForm({
  documentTypes,
  onSubmit,
  onClose,
}: {
  documentTypes: any[];
  onSubmit: (formData: FormData) => Promise<any>;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [referenceImages, setReferenceImages] = useState<FileWithPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    if (arr.length > 0) {
      const f = arr[0] as FileWithPreview;
      if (f.type.startsWith("image/")) {
        f.preview = URL.createObjectURL(f);
      }
      setFile(f);
    }
  }, []);

  const addRefImages = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => {
        const ff = f as FileWithPreview;
        ff.preview = URL.createObjectURL(f);
        return ff;
      });
    setReferenceImages((prev) => [...prev, ...arr]);
  }, []);

  const removeFile = () => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile(null);
  };

  const removeRef = (index: number) => {
    setReferenceImages((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file || !user?._id) return;

    setSubmitting(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);
      formData.append("user_id", user._id);
      if (user.organization_id) {
        formData.append("organization_id", typeof user.organization_id === 'string' ? user.organization_id : user.organization_id._id);
      }
      referenceImages.forEach((f) => formData.append("reference_images", f));
      if (documentTypeId) formData.append("document_type_id", documentTypeId);

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 90));
      }, 200);

      await onSubmit(formData);

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => onClose(), 300);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim() && file !== null && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-2xl border dark:border-white/[0.06] shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <select
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select type (optional)</option>
              {documentTypes.map((dt) => (
                <option key={dt._id} value={dt._id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Files</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <CloudUpload
                size={32}
                className={`${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <p className="text-sm text-muted-foreground">
                {isDragging
                  ? "Drop files here..."
                  : "Drag & drop files or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground/60">
                All file types accepted
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* File Preview List */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  1 file selected
                </p>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card className="dark:bg-card/50 dark:border-white/[0.06]">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {(() => {
                          const Icon = getFileIcon(file.type);
                          return <Icon size={18} className="text-primary" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reference Images */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reference Images{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <div
              onClick={() => refInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all"
            >
              <Image size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Add reference images (jpg, png)
              </span>
              <input
                ref={refInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addRefImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {referenceImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {referenceImages.map((img, i) => (
                  <div key={`ref-${i}`} className="relative group">
                    <img
                      src={img.preview}
                      alt={img.name}
                      className="w-16 h-16 rounded-lg object-cover border dark:border-white/[0.06]"
                    />
                    <button
                      type="button"
                      onClick={() => removeRef(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {submitting && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload size={16} />
                  Upload
                </span>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
