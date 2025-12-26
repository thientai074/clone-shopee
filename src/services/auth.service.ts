import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/User.model';
import RefreshToken from '../models/RefreshToken.model';
import { ApiError } from '../utils/ApiError';
import emailService from './email.service';

class AuthService {
    generateAccessToken(userId: string): string {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        });
    }

    generateRefreshToken(userId: string): string {
        return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        });
    }

    async register(email: string, password: string, name: string, role: 'buyer' | 'seller' = 'buyer'): Promise<IUser> {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw ApiError.conflict('Email already registered');
        }

        // Generate verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            role,
            emailVerificationToken,
        });

        // Send verification email
        await emailService.sendVerificationEmail(email, emailVerificationToken);

        return user;
    }

    async login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw ApiError.unauthorized('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw ApiError.unauthorized('Invalid credentials');
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id.toString());
        const refreshToken = this.generateRefreshToken(user._id.toString());

        // Save refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await RefreshToken.create({
            user: user._id,
            token: refreshToken,
            expiresAt,
        });

        // Remove password from response
        user.password = undefined as any;

        return { user, accessToken, refreshToken };
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

            // Check if token exists in database
            const tokenDoc = await RefreshToken.findOne({ token: refreshToken, user: decoded.userId });
            if (!tokenDoc) {
                throw ApiError.unauthorized('Invalid refresh token');
            }

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(decoded.userId);
            const newRefreshToken = this.generateRefreshToken(decoded.userId);

            // Delete old refresh token and save new one
            await RefreshToken.deleteOne({ _id: tokenDoc._id });

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await RefreshToken.create({
                user: decoded.userId,
                token: newRefreshToken,
                expiresAt,
            });

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            throw ApiError.unauthorized('Invalid refresh token');
        }
    }

    async logout(refreshToken: string): Promise<void> {
        await RefreshToken.deleteOne({ token: refreshToken });
    }

    async verifyEmail(token: string): Promise<void> {
        const user = await User.findOne({ emailVerificationToken: token });
        if (!user) {
            throw ApiError.badRequest('Invalid verification token');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists
            return;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1);

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();

        // Send reset email
        await emailService.sendPasswordResetEmail(email, resetToken);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            throw ApiError.badRequest('Invalid or expired reset token');
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
    }
}

export default new AuthService();
