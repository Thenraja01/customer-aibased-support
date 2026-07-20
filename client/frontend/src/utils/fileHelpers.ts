import { FILE } from './constants';

export function isFileTypeAllowed(file: File): boolean {
  return FILE.ALLOWED_TYPES.includes(file.type as any);
}

export function isFileSizeValid(file: File): boolean {
  return file.size <= FILE.MAX_SIZE;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isFileTypeAllowed(file)) {
    return { valid: false, error: 'File type not supported' };
  }
  if (!isFileSizeValid(file)) {
    return { valid: false, error: 'File exceeds maximum size of 10MB' };
  }
  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPDFFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
