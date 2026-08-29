import { Redis } from "ioredis";
import env from "./env.js";

let client = null;
let memoryFallback = null;

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
    return "OK";
  }

  async del(key) {
    this.store.delete(key);
    return 1;
  }

  async keys(pattern) {
    const regex = new RegExp(
      "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
    );
    return [...this.store.keys()].filter((k) => regex.test(k));
  }
}

export const initRedis = async () => {
  if (client) return client;

  if (!env.REDIS_URL) {
    console.warn("[Redis] No REDIS_URL set — using in-memory fallback cache.");
    memoryFallback = new MemoryCache();
    return null;
  }

  try {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });

    let warned = false;
    client.on("error", (err) => {
      if (!warned) {
        warned = true;
        console.warn("[Redis] Connection error — falling back to in-memory cache:", err.message);
      }
      client = null;
      if (!memoryFallback) memoryFallback = new MemoryCache();
    });

    await client.connect();
    console.log("[Redis] Connected.");
    return client;
  } catch (error) {
    console.warn("[Redis] Failed to connect — using in-memory fallback cache:", error.message);
    client = null;
    if (!memoryFallback) memoryFallback = new MemoryCache();
    return null;
  }
};

export const getCache = () => {
  if (!memoryFallback) memoryFallback = new MemoryCache();
  const activeClient = client;

  return {
    async get(key) {
      try {
        if (activeClient && activeClient.status === "ready") {
          return await activeClient.get(key);
        }
      } catch {
        /* ignore */
      }
      return await memoryFallback.get(key);
    },
    async set(key, value, ttlMs) {
      try {
        if (activeClient && activeClient.status === "ready") {
          if (ttlMs) {
            await activeClient.set(key, value, "PX", ttlMs);
          } else {
            await activeClient.set(key, value);
          }
          return "OK";
        }
      } catch {
        /* ignore */
      }
      return await memoryFallback.set(key, value, ttlMs);
    },
    async del(key) {
      try {
        if (activeClient && activeClient.status === "ready") {
          return await activeClient.del(key);
        }
      } catch {
        /* ignore */
      }
      return await memoryFallback.del(key);
    },
    async keys(pattern) {
      try {
        if (activeClient && activeClient.status === "ready") {
          return await activeClient.keys(pattern);
        }
      } catch {
        /* ignore */
      }
      return await memoryFallback.keys(pattern);
    },
  };
};

export const isRedis = () => Boolean(client && client.status === "ready");

export default {
  initRedis,
  getCache,
  isRedis,
};
