import Redis from "ioredis";
import env from "../config/env.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient = null;

const getRedis = () => {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    redisClient.on("error", (err) => console.error("[Redis] Connection error:", err.message));
  }
  return redisClient;
};

export const getOrgConfig = async (organizationId) => {
  try {
    const redis = getRedis();
    const key = `org:${organizationId}:config`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const setOrgConfig = async (organizationId, config, ttlSeconds = 300) => {
  try {
    const redis = getRedis();
    const key = `org:${organizationId}:config`;
    await redis.setex(key, ttlSeconds, JSON.stringify(config));
  } catch (err) {
    console.error("[Redis] setOrgConfig failed:", err.message);
  }
};

export const invalidateOrgConfig = async (organizationId) => {
  try {
    const redis = getRedis();
    await redis.del(`org:${organizationId}:config`);
  } catch (err) {
    console.error("[Redis] invalidateOrgConfig failed:", err.message);
  }
};

export const getRateLimit = async (key) => {
  try {
    const redis = getRedis();
    return await redis.get(`ratelimit:${key}`);
  } catch {
    return null;
  }
};

export const setRateLimit = async (key, value, ttlSeconds = 60) => {
  try {
    const redis = getRedis();
    await redis.setex(`ratelimit:${key}`, ttlSeconds, value);
  } catch (err) {
    console.error("[Redis] setRateLimit failed:", err.message);
  }
};

export const incrementRateLimit = async (key, ttlSeconds = 60) => {
  try {
    const redis = getRedis();
    const actual = await redis.incr(`ratelimit:${key}`);
    if (actual === 1) await redis.expire(`ratelimit:${key}`, ttlSeconds);
    return actual;
  } catch {
    return 0;
  }
};

export const getQueueConnection = () => {
  return getRedis();
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default {
  getOrgConfig,
  setOrgConfig,
  invalidateOrgConfig,
  getRateLimit,
  setRateLimit,
  incrementRateLimit,
  getQueueConnection,
  closeRedis,
};
