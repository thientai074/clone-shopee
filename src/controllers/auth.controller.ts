import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, name, role } = req.body;
        const user = await authService.register(email, password, name, role);

        res.status(201).json(
            ApiResponse.created('Registration successful. Please check your email to verify your account.', {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            })
        );
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.login(email, password);

        res.json(
            ApiResponse.success('Login successful', {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                },
                accessToken,
                refreshToken,
            })
        );
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshAccessToken(refreshToken);

        res.json(ApiResponse.success('Token refreshed successfully', tokens));
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);

        res.json(ApiResponse.success('Logout successful'));
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.body;
        await authService.verifyEmail(token);

        res.json(ApiResponse.success('Email verified successfully'));
    } catch (error) {
        next(error);
    }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;
        await authService.requestPasswordReset(email);

        res.json(ApiResponse.success('Password reset email sent'));
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);

        res.json(ApiResponse.success('Password reset successful'));
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as AuthRequest).user;
        res.json(ApiResponse.success('User retrieved successfully', { user }));
    } catch (error) {
        next(error);
    }
};
