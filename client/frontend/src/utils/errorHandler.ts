import { toast } from 'sonner';

export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  if (error?.data?.message) return error.data.message;
  return 'An unexpected error occurred';
}

export function extractFieldErrors(error: any): Record<string, string[]> {
  if (error?.response?.data?.errors) return error.response.data.errors;
  if (error?.data?.errors) return error.data.errors;
  return {};
}

export function handleApiError(error: any, fallbackMessage?: string): void {
  const message = extractErrorMessage(error) || fallbackMessage || 'Something went wrong';
  toast.error(message);
}

export function getStatusMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request',
    401: 'Please log in again',
    403: 'You do not have permission',
    404: 'Resource not found',
    409: 'Resource already exists',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'Server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
  };
  return messages[statusCode] || 'An error occurred';
}
