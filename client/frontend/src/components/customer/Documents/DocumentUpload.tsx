import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateFile, createFilePreview } from '@/utils/fileHelpers';
import { formatFileSize } from '@/utils/formatters';

interface DocumentUploadProps {
  onUpload: (file: File, title: string) => Promise<void>;
  uploading?: boolean;
}

export function DocumentUpload({ onUpload, uploading }: DocumentUploadProps) {
  const [files, setFiles] = useState<{ file: File; preview?: string; title: string }[]>([]);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (accepted: File[]) => {
    setError('');
    const newFiles = await Promise.all(
      accepted.map(async (file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          return null;
        }
        const preview = file.type.startsWith('image/') ? await createFilePreview(file) : undefined;
        return { file, preview, title: file.name };
      })
    );
    setFiles((prev) => [...prev, ...newFiles.filter(Boolean) as any[]]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (file: typeof files[0]) => {
    await onUpload(file.file, file.title);
    setFiles((prev) => prev.filter((f) => f !== file));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(Array.from(e.dataTransfer.files));
        }}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, images, DOC - Max 10MB
        </p>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <File size={20} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
              >
                <X size={16} />
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpload(file)}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
