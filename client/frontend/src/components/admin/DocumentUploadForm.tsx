import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, X, Upload } from "lucide-react";

interface FormErrors {
  title?: string;
  file?: string;
  submit?: string;
}

export default function DocumentUploadForm({
  documentTypes,
  roles = [],
  onSubmit,
  onClose,
}: {
  documentTypes: any[];
  roles?: any[];
  onSubmit: (formData: FormData) => Promise<any>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [assignedRole, setAssignedRole] = useState("All");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = useCallback((field: string, value: any): string => {
    switch (field) {
      case "title":
        return value.trim() ? "" : "Title is required";
      case "file":
        return value ? "" : "File is required";
      default:
        return "";
    }
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const titleErr = validateField("title", title);
    if (titleErr) newErrors.title = titleErr;
    const fileErr = validateField("file", file);
    if (fileErr) newErrors.file = fileErr;
    if (file && file.size > 50 * 1024 * 1024) {
      newErrors.file = "File must be less than 50MB";
    }
    setErrors(newErrors);
    setTouched({ title: true, file: true });
    return Object.keys(newErrors).length === 0;
  }, [title, file, validateField]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "title") setErrors((prev) => ({ ...prev, title: validateField("title", title) }));
    if (field === "file") setErrors((prev) => ({ ...prev, file: validateField("file", file) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("assigned_role", assignedRole);
      formData.append("file", file!);
      if (documentTypeId) formData.append("document_type_id", documentTypeId);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || err?.message || "Upload failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const maxFileSize = 50 * 1024 * 1024;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (touched.title) setErrors((p) => ({ ...p, title: validateField("title", e.target.value) })); }}
              onBlur={() => handleBlur("title")}
              placeholder="Document title"
              className={errors.title && touched.title ? "border-destructive" : ""}
              aria-invalid={!!errors.title}
            />
            {errors.title && touched.title && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Document Type</Label>
            <select
              id="doc-type"
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(e.target.value)}
              className="select-field"
            >
              <option value="">Select type (optional)</option>
              {documentTypes.map((dt) => (
                <option key={dt._id} value={dt._id}>{dt.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-role">Assign Role</Label>
            <select
              id="doc-role"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              className="select-field"
            >
              <option value="All">All</option>
              {roles.map((r) => (
                <option key={r._id} value={r.role_name || r.role_name}>{r.role_name || r.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Documents are visible only to users with this role</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File</Label>
            <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors ${errors.file && touched.file ? "border-destructive" : "dark:border-white/[0.06]"}`}
              onClick={() => document.getElementById("doc-file")?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") document.getElementById("doc-file")?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Select file to upload"
            >
              {file ? (
                <div className="space-y-1">
                  <Upload size={24} className="mx-auto text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-destructive hover:underline mt-1">Remove</button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload size={24} className="mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground/70">PDF, DOCX, TXT up to 50MB</p>
                </div>
              )}
              <input
                id="doc-file"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f && f.size > maxFileSize) {
                    setErrors((p) => ({ ...p, file: "File must be less than 50MB" }));
                    setFile(null);
                  } else {
                    setFile(f);
                    setErrors((p) => ({ ...p, file: "" }));
                  }
                }}
                onBlur={() => handleBlur("file")}
                className="sr-only"
                aria-hidden="true"
              />
            </div>
            {errors.file && touched.file && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.file}</p>
            )}
          </div>

          {errors.submit && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
              <AlertCircle size={14} />{errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
