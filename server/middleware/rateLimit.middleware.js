import rateLimit from "express-rate-limit";
import env from "../config/env.js";

/**
 * Global API limiter. Protects the platform during ticket spikes (e.g. 10k+
 * tickets). Returns 429 with a Retry-After header when exceeded.
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

/**
 * Stricter limiter for authentication endpoints (login, OTP, register) to
 * prevent credential-stuffing and OTP brute force.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/**
 * Stricter limiter for ticket creation during extreme spikes. Default is
 * generous (e.g. 300 per 15 min per IP) — tune via env.
 */
export const ticketCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Ticket creation rate limit exceeded. Please try again later.",
  },
});