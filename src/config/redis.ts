import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
    logger.error(`Redis Client Error: ${err}`);
});

redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
    logger.info('Redis Client Ready');
});

redisClient.on('end', () => {
    logger.warn('Redis Client Disconnected');
});

export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
    } catch (error: any) {
        logger.error(`Failed to connect to Redis: ${error.message}`);
        // Don't exit process, allow app to run without cache
    }
};

export default redisClient;
