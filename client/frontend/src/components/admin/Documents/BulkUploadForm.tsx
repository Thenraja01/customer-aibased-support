import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

export function BulkUploadForm() {
  const [files, setFiles] = useState<{ file: File; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, status: 'pending' as const })),
    ]);
  }, []);

  const uploadAll = async () => {
    const DocumentAPI = (await import('@/api/document.api')).default;
    for (const item of files) {
      if (item.status !== 'pending') continue;
      setFiles((prev) =>
        prev.map((f) => (f.file === item.file ? { ...f, status: 'uploading' } : f))
      );
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        await DocumentAPI.upload(formData);
        setFiles((prev) =>
          prev.map((f) => (f.file === item.file ? { ...f, status: 'done' } : f))
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) => (f.file === item.file ? { ...f, status: 'error' } : f))
        );
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => document.getElementById('bulk-upload')?.click()}
      >
        <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">Drop multiple files here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        <input
          id="bulk-upload"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="space-y-2">
            {files.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {item.status === 'done' ? (
                  <CheckCircle size={18} className="text-green-500 shrink-0" />
                ) : (
                  <File size={18} className="text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                </div>
                {item.status === 'uploading' ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <button onClick={() => removeFile(index)}>
                    <X size={16} className="text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button onClick={uploadAll} disabled={files.every((f) => f.status === 'done')}>
            Upload All
          </Button>
        </>
      )}
    </div>
  );
}
