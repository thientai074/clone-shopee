import redisClient from '../config/redis';
import logger from '../utils/logger';

class CacheService {
    async get<T>(key: string): Promise<T | null> {
        try {
            if (!redisClient.isOpen) {
                return null;
            }

            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error: any) {
            logger.error(`Cache get error: ${error.message}`);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = 300): Promise<void> {
        try {
            if (!redisClient.isOpen) {
                return;
            }

            await redisClient.setEx(key, ttl, JSON.stringify(value));
        } catch (error: any) {
            logger.error(`Cache set error: ${error.message}`);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            if (!redisClient.isOpen) {
                return;
            }

            await redisClient.del(key);
        } catch (error: any) {
            logger.error(`Cache delete error: ${error.message}`);
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        try {
            if (!redisClient.isOpen) {
                return;
            }

            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } catch (error: any) {
            logger.error(`Cache delete pattern error: ${error.message}`);
        }
    }

    async clear(): Promise<void> {
        try {
            if (!redisClient.isOpen) {
                return;
            }

            await redisClient.flushDb();
        } catch (error: any) {
            logger.error(`Cache clear error: ${error.message}`);
        }
    }
}

export default new CacheService();
