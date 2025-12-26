import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        throw ApiError.badRequest('Too many requests, please try again later');
    },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        throw ApiError.badRequest('Too many authentication attempts, please try again later');
    },
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Too many upload requests, please try again later',
    handler: (req, res) => {
        throw ApiError.badRequest('Too many upload requests, please try again later');
    },
});
