export const authConfig = {
  tokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  userKey: 'user',
  tokenExpiryBuffer: 300000,
  socialLogin: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/google/callback`,
    },
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/github/callback`,
    },
  },
} as const;
