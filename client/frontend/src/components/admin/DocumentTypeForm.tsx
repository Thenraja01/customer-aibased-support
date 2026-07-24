import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, X } from "lucide-react";

interface FormErrors {
  name?: string;
  description?: string;
  submit?: string;
}

export default function DocumentTypeForm({
  documentType,
  onSubmit,
  onClose,
}: {
  documentType?: any;
  onSubmit: (data: any) => Promise<any>;
  onClose: () => void;
}) {
  const [name, setName] = useState(documentType?.name || "");
  const [description, setDescription] = useState(documentType?.description || "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (name.length > 100) newErrors.name = "Max 100 characters";
    if (description && description.length > 500) newErrors.description = "Max 500 characters";
    setErrors(newErrors);
    setTouched({ name: true });
    return Object.keys(newErrors).length === 0;
  }, [name, description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to save document type" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{documentType ? "Edit Document Type" : "New Document Type"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dt-name">Name</Label>
            <Input
              id="dt-name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (touched.name) setErrors((p) => ({ ...p, name: "" })); }}
              onBlur={() => { setTouched((p) => ({ ...p, name: true })); if (!name.trim()) setErrors((p) => ({ ...p, name: "Name is required" })); }}
              placeholder="e.g. Passport, ID Card"
              className={errors.name && touched.name ? "border-destructive" : ""}
              aria-invalid={!!errors.name}
            />
            {errors.name && touched.name && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dt-desc">Description</Label>
            <Input
              id="dt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.description}</p>}
          </div>

          {errors.submit && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
              <AlertCircle size={14} />{errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : documentType ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
