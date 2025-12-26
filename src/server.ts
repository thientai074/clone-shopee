import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to databases
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Connect to Redis (optional, app will work without it)
        await connectRedis().catch((err) => {
            logger.warn('Redis connection failed, continuing without cache');
        });

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger.info(`API available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
        });
    } catch (error: any) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
