import type { Middleware } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@/utils/errorHandler';

export const errorMiddleware: Middleware = () => (next) => (action: any) => {
  if (action.type?.endsWith('rejected')) {
    const errorMessage = action.payload || action.error?.message || 'An unexpected error occurred';
    console.error(`[Error] ${action.type}:`, errorMessage);
  }
  return next(action);
};
