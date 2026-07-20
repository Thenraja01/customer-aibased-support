import { useState, useCallback } from 'react';
import { validateFile, createFilePreview } from '@/utils/fileHelpers';

export function useFileUpload() {
  const [files, setFiles] = useState<{ file: File; preview?: string; progress: number; uploaded: boolean; error?: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const processed = await Promise.all(
      Array.from(newFiles).map(async (file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          return { file, preview: undefined, progress: 0, uploaded: false, error: validation.error };
        }
        const preview = file.type.startsWith('image/') ? await createFilePreview(file) : undefined;
        return { file, preview, progress: 0, uploaded: false, error: undefined };
      })
    );
    setFiles((prev) => [...prev, ...processed]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const updateProgress = useCallback((index: number, progress: number) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress } : f)));
  }, []);

  const markUploaded = useCallback((index: number) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, uploaded: true, progress: 100 } : f)));
  }, []);

  return {
    files, uploading, setUploading, addFiles, removeFile, clearFiles, updateProgress, markUploaded,
  };
}
