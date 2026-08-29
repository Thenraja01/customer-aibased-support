import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, X, Upload, Loader2, History } from "lucide-react";

export default function VersionUploadModal({
  doc,
  onSubmit,
  onClose,
}: {
  doc: any;
  onSubmit: (formData: FormData) => Promise<any>;
  onClose: () => void;
}) {
  const [changelog, setChangelog] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("changelog", changelog || `Version ${(doc.version_number || 1) + 1}`);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Version upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Upload New Version</h2>
              <p className="text-xs text-muted-foreground">
                {doc.title} · currently v{doc.version_number || 1}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">New File</label>
            <div
              className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer hover:bg-muted/50 transition-colors dark:border-white/[0.06]"
              onClick={() => document.getElementById("version-file")?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") document.getElementById("version-file")?.click(); }}
              tabIndex={0}
              role="button"
              aria-label="Select file for new version"
            >
              {file ? (
                <div className="space-y-1">
                  <Upload size={22} className="mx-auto text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-destructive hover:underline mt-1">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload size={22} className="mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Click to select the replacement file</p>
                  <p className="text-xs text-muted-foreground/70">PDF, DOCX, TXT up to 50MB</p>
                </div>
              )}
              <input
                id="version-file"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f && f.size > 50 * 1024 * 1024) {
                    setError("File must be less than 50MB");
                    setFile(null);
                  } else {
                    setFile(f);
                    setError(null);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Changelog / Notes</label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="What changed in this version?"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" /> Uploading...
                </span>
              ) : (
                "Upload Version"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
