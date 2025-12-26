import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = err;

    // Convert non-ApiError errors to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = 500;
        const message = error.message || 'Internal server error';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    const apiError = error as ApiError;

    // Log error
    if (apiError.statusCode >= 500) {
        logger.error(`${apiError.statusCode} - ${apiError.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
        logger.error(apiError.stack);
    } else {
        logger.warn(`${apiError.statusCode} - ${apiError.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }

    // Send error response
    res.status(apiError.statusCode).json({
        success: false,
        statusCode: apiError.statusCode,
        message: apiError.message,
        ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack }),
    });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};
