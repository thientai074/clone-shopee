import nodemailer from 'nodemailer';
import logger from '../utils/logger';

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to,
                subject,
                html,
            });
            logger.info(`Email sent to ${to}`);
        } catch (error: any) {
            logger.error(`Email send error: ${error.message}`);
            throw error;
        }
    }

    async sendVerificationEmail(to: string, token: string): Promise<void> {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Thank you for registering! Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ee4d2d; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;
        await this.sendEmail(to, 'Verify Your Email', html);
    }

    async sendPasswordResetEmail(to: string, token: string): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ee4d2d; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
        await this.sendEmail(to, 'Password Reset Request', html);
    }

    async sendOrderConfirmation(to: string, orderNumber: string, totalAmount: number): Promise<void> {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Total Amount:</strong> ${totalAmount.toLocaleString('vi-VN')} ₫</p>
        <p>You can track your order status in your account.</p>
      </div>
    `;
        await this.sendEmail(to, `Order Confirmation - ${orderNumber}`, html);
    }
}

export default new EmailService();
