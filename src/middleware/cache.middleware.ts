import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import logger from '../utils/logger';

export const cache = (duration: number = 300) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.method !== 'GET') {
            return next();
        }

        try {
            const key = `cache:${req.originalUrl}`;

            // Check if Redis is connected
            if (!redisClient.isOpen) {
                return next();
            }

            const cachedData = await redisClient.get(key);

            if (cachedData) {
                logger.debug(`Cache hit for ${key}`);
                res.json(JSON.parse(cachedData));
                return;
            }

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache response
            res.json = ((data: any) => {
                res.json = originalJson;

                // Cache the response
                redisClient.setEx(key, duration, JSON.stringify(data))
                    .catch((err) => logger.error(`Cache set error: ${err.message}`));

                return res.json(data);
            }) as any;

            next();
        } catch (error: any) {
            logger.error(`Cache middleware error: ${error.message}`);
            next();
        }
    };
};

export const clearCache = (pattern: string = '*') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (redisClient.isOpen) {
                const keys = await redisClient.keys(`cache:${pattern}`);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                    logger.debug(`Cleared ${keys.length} cache entries`);
                }
            }
        } catch (error: any) {
            logger.error(`Clear cache error: ${error.message}`);
        }
        next();
    };
};
