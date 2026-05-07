import { redis } from "../config/redis";
import logger from "./logger";

const DEFAULT_TTL = 300; // 5 minutes in seconds

/**
 * Set a value in cache with TTL
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (default: 300)
 */
const setCache = async (key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> => {
    if (!redis) {
        logger.debug("Redis not available, skipping cache set", { key });
        return;
    }

    try {
        const serialized = JSON.stringify(value);
        await redis.setex(key, ttl, serialized);
        logger.debug("Cache set", { key, ttl });
    } catch (error) {
        logger.error("Cache set error", { key, error: (error as Error).message });
    }
};

/**
 * Get a value from cache
 * @param key - Cache key
 * @returns Parsed value or null if not found
 */
const getCache = async <T = any>(key: string): Promise<T | null> => {
    if (!redis) {
        logger.debug("Redis not available, skipping cache get", { key });
        return null;
    }

    try {
        const value = await redis.get(key);
        if (!value) {
            logger.debug("Cache miss", { key });
            return null;
        }

        const parsed = JSON.parse(value) as T;
        logger.debug("Cache hit", { key });
        return parsed;
    } catch (error) {
        logger.error("Cache get error", { key, error: (error as Error).message });
        return null;
    }
};

/**
 * Delete a value from cache
 * @param key - Cache key
 */
const deleteCache = async (key: string): Promise<void> => {
    if (!redis) {
        logger.debug("Redis not available, skipping cache delete", { key });
        return;
    }

    try {
        await redis.del(key);
        logger.debug("Cache deleted", { key });
    } catch (error) {
        logger.error("Cache delete error", { key, error: (error as Error).message });
    }
};

/**
 * Check if Redis cache is available
 */
const isCacheAvailable = (): boolean => {
    return redis !== null;
};

export { setCache, getCache, deleteCache, isCacheAvailable };
export default { setCache, getCache, deleteCache, isCacheAvailable };
