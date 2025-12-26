import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import User from '../models/User.model';
import { AuthRequest } from '../types';

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        // Attach user to request
        (req as AuthRequest).user = user as any;
        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            next(ApiError.unauthorized('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(ApiError.unauthorized('Token expired'));
        } else {
            next(error);
        }
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthRequest).user;

        if (!user) {
            throw ApiError.unauthorized('Not authenticated');
        }

        if (!roles.includes(user.role)) {
            throw ApiError.forbidden('You do not have permission to perform this action');
        }

        next();
    };
};

export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            const user = await User.findById(decoded.userId).select('-password');

            if (user) {
                (req as AuthRequest).user = user as any;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
