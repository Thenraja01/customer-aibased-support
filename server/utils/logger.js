import winston from "winston";
import path from "path";

// Sensitive keys to automatically redact
const SENSITIVE_KEYS = new Set([
  "password",
  "secret",
  "apikey",
  "api_key",
  "token",
  "authorization",
  "accesstoken",
  "refreshtoken",
  "jwt",
]);

/**
 * Deeply redact sensitive properties from metadata objects
 */
function sanitize(obj, depth = 0) {
  if (depth > 3 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = "●●●●●●●● (REDACTED)";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitize(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Custom format for clean, human-readable terminal output
const consoleFormat = winston.format.printf(({ level, message, tag, timestamp, stack, ...meta }) => {
  const timeStr = `\x1b[90m[${timestamp}]\x1b[0m`;
  const tagStr = tag ? `\x1b[1m[${tag}]\x1b[0m` : "";
  const base = `${timeStr} ${level} ${tagStr} ${message}`;

  let extra = "";
  if (stack) {
    extra += `\n\x1b[31m${stack}\x1b[0m`;
  }
  if (Object.keys(meta).length > 0) {
    extra += `\n${JSON.stringify(sanitize(meta), null, 2)}`;
  }

  return `${base}${extra}`;
});

// Create Winston Logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: false }),
        winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
        consoleFormat
      ),
    }),
  ],
});

// Add file transport in production/development if logs directory is desired
if (process.env.ENABLE_FILE_LOGGING === "true") {
  winstonLogger.add(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: winston.format.json(),
    })
  );
  winstonLogger.add(
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      format: winston.format.json(),
    })
  );
}

/**
 * Standardized Logger API wrapper
 */
export const logger = {
  info: (tag, message, meta = {}) => {
    winstonLogger.info(message, { tag, ...meta });
  },

  success: (tag, message, meta = {}) => {
    // Uses green check styling
    winstonLogger.info(`\x1b[32m✅ ${message}\x1b[0m`, { tag, ...meta });
  },

  warn: (tag, message, meta = {}) => {
    winstonLogger.warn(message, { tag, ...meta });
  },

  error: (tag, message, err = null) => {
    if (err instanceof Error) {
      winstonLogger.error(message, { tag, stack: err.stack });
    } else if (err) {
      winstonLogger.error(message, { tag, ...err });
    } else {
      winstonLogger.error(message, { tag });
    }
  },

  debug: (tag, message, meta = {}) => {
    winstonLogger.debug(message, { tag, ...meta });
  },

  rag: (message, meta = {}) => {
    winstonLogger.info(`\x1b[34m🔍 [RAG]\x1b[0m ${message}`, meta);
  },

  ingest: (message, meta = {}) => {
    winstonLogger.info(`\x1b[36m⚡ [INGEST]\x1b[0m ${message}`, meta);
  },

  // Raw winston instance for advanced streaming or morgan middleware
  stream: {
    write: (message) => winstonLogger.info(message.trim(), { tag: "HTTP" }),
  },
  raw: winstonLogger,
};

export default logger;
