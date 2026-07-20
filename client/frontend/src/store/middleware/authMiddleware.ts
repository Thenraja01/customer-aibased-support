import type { Middleware } from '@reduxjs/toolkit';
import { tokenManager } from '@/utils/tokenManager';

export const authMiddleware: Middleware = () => (next) => (action: any) => {
  if (action.type?.endsWith('rejected')) {
    const status = action.payload?.status || action.error?.status;
    if (status === 401) {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
  }
  return next(action);
};
