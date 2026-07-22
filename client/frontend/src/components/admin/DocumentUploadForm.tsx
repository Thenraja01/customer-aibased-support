import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

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
  const [assigned_role, setAssignedRole] = useState("All");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("assigned_role", assigned_role);
      formData.append("file", file);
      if (documentTypeId) formData.append("document_type_id", documentTypeId);

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="select-field"
            >
              <option value="">Select type (optional)</option>
              {documentTypes.map((dt) => (
                <option key={dt._id} value={dt._id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Role</label>
            <select
              value={assigned_role}
              onChange={(e) => setAssignedRole(e.target.value)}
              className="select-field"
            >
              <option value="All">All</option>
              {roles.map((r) => (
                <option key={r._id} value={r.role_name}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">File</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title || !file}>
              {submitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
