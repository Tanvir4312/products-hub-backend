import { Redis } from "ioredis";
import { envVars } from "./env";
import logger from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;

if (REDIS_URL) {
    redis = new Redis(REDIS_URL, {
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    });

    redis.on("connect", () => {
        logger.info("Redis connected successfully");
    });

    redis.on("error", (err) => {
        logger.error("Redis connection error", { error: err.message });
    });

    redis.on("reconnecting", () => {
        logger.warn("Redis reconnecting...");
    });
} else {
    logger.warn("REDIS_URL not provided, Redis caching disabled");
}

export { redis };
export default redis;
