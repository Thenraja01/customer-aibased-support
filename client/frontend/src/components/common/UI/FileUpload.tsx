import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFilesSelected,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  className,
  disabled,
}: FileUploadProps) {
  const onDrop = useCallback((accepted: File[]) => {
    onFilesSelected(accepted);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors',
        isDragActive && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
      {isDragActive ? (
        <p className="text-sm font-medium">Drop files here...</p>
      ) : (
        <>
          <p className="text-sm font-medium">Drag & drop files or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            Max file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </>
      )}
    </div>
  );
}
