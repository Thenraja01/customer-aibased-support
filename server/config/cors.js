// Shared CORS allowlist used by Express HTTP layer and Socket.IO.
export const allowedOrigins = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("https://localhost:") ||
    origin.startsWith("https://127.0.0.1:") ||
    origin === process.env.CLIENT_URL ||
    origin === process.env.FRONTEND_URL
  ) {
    return callback(null, true);
  }
  // Allow embedded widget cross-origin domains
  return callback(null, true);
};