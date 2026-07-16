import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DocumentTypeTable from "@/components/admin/DocumentTypeTable";
import DocumentTypeForm from "@/components/admin/DocumentTypeForm";
import { useAdminDocumentTypes } from "@/hooks/useAdminDocumentTypes";

export default function DocumentTypesPage() {
  const {
    documentTypes,
    loading,
    fetchDocumentTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
  } = useAdminDocumentTypes();

  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  const handleCreate = async (data: any) => {
    await createDocumentType(data);
    fetchDocumentTypes();
  };

  const handleUpdate = async (data: any) => {
    if (!editingType) return;
    await updateDocumentType(editingType._id, data);
    fetchDocumentTypes();
  };

  const handleDelete = async (dt: any) => {
    if (!confirm(`Delete document type "${dt.name}"?`)) return;
    await deleteDocumentType(dt._id);
    fetchDocumentTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Types</h1>
          <p className="text-muted-foreground">
            Manage document type categories.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingType(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} className="mr-1" />
          New Document Type
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : (
          <DocumentTypeTable
            documentTypes={documentTypes}
            onEdit={(dt) => {
              setEditingType(dt);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showForm && (
        <DocumentTypeForm
          documentType={editingType}
          onSubmit={editingType ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditingType(null);
          }}
        />
      )}
    </div>
  );
}
