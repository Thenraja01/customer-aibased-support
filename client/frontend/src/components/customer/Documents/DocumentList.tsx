import { useState, useEffect } from 'react';
import DocumentAPI from '@/api/document.api.js';
import { formatDate, formatFileSize } from '@/utils/formatters';
import { FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/UI/StatusBadge';

export function DocumentList() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await DocumentAPI.getAll({ limit: 50 });
      setDocuments(res.data.data || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DocumentAPI.delete(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      // fail silently
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center gap-4 p-4 rounded-lg border bg-card"
        >
          <FileText size={24} className="text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.title || doc.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(doc.file_size)} &middot; {formatDate(doc.created_at)}
            </p>
          </div>
          <StatusBadge status={doc.status} />
          <button
            onClick={async () => {
              const url = await DocumentAPI.getDownloadUrl?.(doc._id) as string | undefined;
              if (url) window.open(url, '_blank');
            }}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <Download size={16} />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(doc._id)}
          >
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
