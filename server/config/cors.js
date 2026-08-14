// Shared CORS allowlist used by both the Express HTTP layer and Socket.IO.
// The Vite dev server runs on port 3000 (see client/frontend/vite.config.ts),
// so that origin is included alongside the legacy 5173 dev origins. Additional
// origins can be supplied via CLIENT_URL / FRONTEND_URL env vars.
export const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:64788",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);