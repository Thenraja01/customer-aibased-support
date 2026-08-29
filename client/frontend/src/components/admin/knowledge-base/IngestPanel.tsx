import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Upload, ShieldCheck, Layers, History, AlertCircle, Check } from "lucide-react";
import DocumentUploadForm from "@/components/admin/DocumentUploadForm";
import VersionUploadModal from "./VersionUploadModal";
import DocumentTypeAPI from "@/api/documentType.api";
import { useToast } from "@/components/ui/toast";

interface IngestPanelProps {
  documentTypes: any[];
  branches: any[];
  roles: any[];
  documents: any[];
  onUpload: (formData: FormData) => Promise<any>;
  onUploadVersion: (doc: any, formData: FormData) => Promise<any>;
  onDocumentTypeCreated: () => void;
}

export default function IngestPanel({
  documentTypes,
  branches,
  roles,
  documents,
  onUpload,
  onUploadVersion,
  onDocumentTypeCreated,
}: IngestPanelProps) {
  const toast = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [versionTarget, setVersionTarget] = useState<any>(null);
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [savingType, setSavingType] = useState(false);
  const [localTypes, setLocalTypes] = useState<any[]>(documentTypes);
  const [selectedDoc, setSelectedDoc] = useState("");

  useEffect(() => {
    setLocalTypes(documentTypes);
  }, [documentTypes]);

  const handleCreateType = async () => {
    if (!typeName.trim()) {
      toast.error("Error", "Type name is required");
      return;
    }
    setSavingType(true);
    try {
      await DocumentTypeAPI.create({ name: typeName.trim(), description: typeDesc.trim() || undefined });
      setTypeName("");
      setTypeDesc("");
      onDocumentTypeCreated();
      toast.success("Document type created");
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to create document type");
    } finally {
      setSavingType(false);
    }
  };

  const handleDeleteType = async (dt: any) => {
    if (!confirm(`Delete document type "${dt.name}"?`)) return;
    try {
      await DocumentTypeAPI.remove(dt._id);
      onDocumentTypeCreated();
      toast.success("Document type deleted");
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to delete document type");
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Upload size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Upload New Document</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Upload PDF, DOCX, or TXT files to add knowledge to the AI support assistant. Files are automatically
            chunked and indexed for retrieval after processing.
          </p>
          <Button onClick={() => setShowUpload(true)}>
            <Upload size={14} className="mr-1" /> Upload Document
          </Button>
        </div>
      </div>

      {/* Version Upload Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <History size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Upload New Version</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Replace the content of an existing document with a new file version.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="select-field flex-1"
            >
              <option value="">Select a document...</option>
              {documents.map((d) => (
                <option key={d._id} value={d._id}>{d.title} (v{d.version_number || 1})</option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={!selectedDoc}
              onClick={() => {
                const doc = documents.find((d) => d._id === selectedDoc);
                if (doc) setVersionTarget(doc);
              }}
            >
              <History size={14} className="mr-1" /> Upload Version
            </Button>
          </div>
        </div>
      </div>

      {/* Document Types Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Document Types</h2>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dt-name">New Type Name</Label>
              <Input
                id="dt-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="e.g. Policy, SOP, Product Guide"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dt-desc">Description (optional)</Label>
              <Input
                id="dt-desc"
                value={typeDesc}
                onChange={(e) => setTypeDesc(e.target.value)}
                placeholder="Short description of this type"
              />
            </div>
            <Button onClick={handleCreateType} disabled={savingType} size="sm">
              {savingType ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
              Create Type
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {localTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No document types yet.</p>
            ) : (
              localTypes.map((dt) => (
                <div key={dt._id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{dt.name}</p>
                    {dt.description && <p className="text-xs text-muted-foreground truncate">{dt.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteType(dt)}
                    className="p-1 rounded-md text-destructive hover:bg-destructive/10 shrink-0"
                    title="Delete type"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Access Policy Card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Access &amp; Visibility</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Access is controlled per document at upload time:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Check size={15} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Branch Scope</p>
                <p className="text-xs text-muted-foreground">Organization-wide or restricted to a specific branch.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check size={15} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Role Visibility</p>
                <p className="text-xs text-muted-foreground">Who can view: admins, branch admins, support, or customers.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check size={15} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Approval Workflow</p>
                <p className="text-xs text-muted-foreground">Documents require approval before publishing to the AI.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Customer Visibility</p>
                <p className="text-xs text-muted-foreground">Only approved &amp; published docs are used in customer-facing RAG.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showUpload && (
        <DocumentUploadForm
          documentTypes={documentTypes}
          roles={roles}
          branches={branches}
          onSubmit={onUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {versionTarget && (
        <VersionUploadModal
          doc={versionTarget}
          onSubmit={(formData) => onUploadVersion(versionTarget, formData)}
          onClose={() => setVersionTarget(null)}
        />
      )}
    </div>
  );
}
