import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

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
  const [description, setDescription] = useState(
    documentType?.description || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    try {
      await onSubmit({ name, description });
      onClose();
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {documentType ? "Edit Document Type" : "New Document Type"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Passport, ID Card"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name}>
              {submitting ? "Saving..." : documentType ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
