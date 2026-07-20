import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/UI/StatusBadge';
import { formatRelativeTime, formatFileSize } from '@/utils/formatters';
import { FileText, Check, X } from 'lucide-react';
import { Textarea } from '@/components/common/Forms/Textarea';

export function VerificationQueue() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { default: DocumentAPI } = await import('@/api/document.api');
      const res = await DocumentAPI.getAll({ status: 'pending' });
      setDocuments(res.data.data || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId: string, status: 'approved' | 'rejected') => {
    try {
      const { default: DocumentVerificationAPI } = await import('@/api/documentVerification.api');
      await DocumentVerificationAPI.verify(docId, { status, remarks: remarks[docId] || '' });
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch {
      // fail silently
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No documents pending verification</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc._id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium truncate">{doc.title || doc.file_name}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(doc.file_size)} &middot; {formatRelativeTime(doc.created_at)}
                </p>
              </div>
              <StatusBadge status={doc.status} />
            </div>
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Verification remarks..."
                value={remarks[doc._id] || ''}
                onChange={(e) => setRemarks((prev) => ({ ...prev, [doc._id]: e.target.value }))}
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleVerify(doc._id, 'approved')}>
                  <Check size={14} className="mr-1 text-green-500" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleVerify(doc._id, 'rejected')}>
                  <X size={14} className="mr-1 text-red-500" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
