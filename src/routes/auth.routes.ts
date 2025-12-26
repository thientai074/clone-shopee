import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import * as authValidation from '../validations/auth.validation';

const router = Router();

/**
 * ==============================================
 * AUTH ROUTES - Các route xác thực và quản lý tài khoản
 * ==============================================
 */

/**
 * POST /api/v1/auth/register
 * Đăng ký tài khoản mới
 * 
 * Mục đích:
 * - Tạo tài khoản user mới
 * - Hash password với bcrypt
 * - Gửi email xác thực (nếu có cấu hình)
 * - Tạo access token và refresh token
 * 
 * Rate Limit: Có (authLimiter) - Ngăn spam đăng ký
 * Request body:
 * - name: Tên người dùng
 * - email: Email (unique)
 * - password: Mật khẩu (min 6 ký tự)
 * - role: buyer | seller (optional, default: buyer)
 */
router.post('/register', authLimiter, validate(authValidation.registerSchema), authController.register);

/**
 * POST /api/v1/auth/login
 * Đăng nhập vào hệ thống
 * 
 * Mục đích:
 * - Xác thực email và password
 * - Tạo access token (15 phút) và refresh token (7 ngày)
 * - Lưu refresh token vào database
 * - Set cookie với refresh token
 * 
 * Rate Limit: Có (authLimiter) - Ngăn brute force attack
 * Request body:
 * - email: Email đăng ký
 * - password: Mật khẩu
 */
router.post('/login', authLimiter, validate(authValidation.loginSchema), authController.login);

/**
 * POST /api/v1/auth/refresh-token
 * Làm mới access token
 * 
 * Mục đích:
 * - Tạo access token mới khi token cũ hết hạn
 * - Verify refresh token từ cookie hoặc body
 * - Tạo refresh token mới (rotation)
 * - Không cần đăng nhập lại
 * 
 * Request body:
 * - refreshToken: Refresh token (hoặc từ cookie)
 */
router.post('/refresh-token', validate(authValidation.refreshTokenSchema), authController.refreshToken);

/**
 * POST /api/v1/auth/logout
 * Đăng xuất khỏi hệ thống
 * 
 * Mục đích:
 * - Xóa refresh token khỏi database
 * - Clear cookie
 * - Invalidate session
 * 
 * Request body:
 * - refreshToken: Refresh token cần xóa
 */
router.post('/logout', authController.logout);

/**
 * POST /api/v1/auth/verify-email
 * Xác thực email sau khi đăng ký
 * 
 * Mục đích:
 * - Verify email token từ link trong email
 * - Đánh dấu email đã được xác thực
 * - Kích hoạt tài khoản
 * 
 * Request body:
 * - token: Email verification token
 */
router.post('/verify-email', validate(authValidation.verifyEmailSchema), authController.verifyEmail);

/**
 * POST /api/v1/auth/request-password-reset
 * Yêu cầu reset mật khẩu
 * 
 * Mục đích:
 * - Tạo password reset token
 * - Gửi email với link reset password
 * - Token có thời hạn (thường 1 giờ)
 * 
 * Rate Limit: Có (authLimiter) - Ngăn spam email
 * Request body:
 * - email: Email tài khoản cần reset
 */
router.post('/request-password-reset', authLimiter, validate(authValidation.requestPasswordResetSchema), authController.requestPasswordReset);

/**
 * POST /api/v1/auth/reset-password
 * Reset mật khẩu mới
 * 
 * Mục đích:
 * - Verify reset token
 * - Cập nhật mật khẩu mới
 * - Hash password mới
 * - Xóa reset token
 * 
 * Request body:
 * - token: Password reset token
 * - newPassword: Mật khẩu mới
 */
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);

/**
 * GET /api/v1/auth/me
 * Lấy thông tin user hiện tại
 * 
 * Mục đích:
 * - Lấy thông tin profile của user đang đăng nhập
 * - Verify access token
 * - Dùng để check authentication status
 * 
 * Authentication: Required
 * Headers:
 * - Authorization: Bearer <access_token>
 */
router.get('/me', authenticate, authController.getMe);

export default router;

