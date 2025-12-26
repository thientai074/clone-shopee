import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

/**
 * Payment Controller
 * Xử lý các request liên quan đến thanh toán
 */

/**
 * Khởi tạo thanh toán cho một order
 * POST /api/v1/payment/initiate
 * 
 * Request body:
 * - orderId: ID của order cần thanh toán
 * - paymentMethod: Phương thức thanh toán (vnpay/momo/bank-card)
 * - bankCode: Mã ngân hàng (optional, cho VNPay)
 * 
 * Response:
 * - paymentUrl: URL để redirect user đến trang thanh toán
 * - payment: Thông tin payment record
 */
export const initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { orderId, paymentMethod, bankCode } = req.body;

        // Lấy IP address của client
        const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

        const result = await paymentService.initiatePayment({
            orderId,
            userId,
            paymentMethod,
            ipAddress,
            bankCode,
        });

        res.status(200).json(
            ApiResponse.success('Payment initiated successfully', {
                paymentUrl: result.paymentUrl,
                deeplink: result.deeplink,
                qrCodeUrl: result.qrCodeUrl,
                payment: result.payment,
            })
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Xử lý callback từ VNPay
 * GET /api/v1/payment/vnpay/callback
 * 
 * VNPay sẽ redirect user về URL này sau khi thanh toán
 * Query params chứa kết quả thanh toán và chữ ký
 * 
 * Response: Redirect về frontend với kết quả
 */
export const vnpayCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const vnpParams = req.query;

        const result = await paymentService.handlePaymentCallback('vnpay', vnpParams);

        // Redirect về frontend với kết quả
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/payment/result?success=${result.success}&orderId=${result.orderId}&message=${encodeURIComponent(result.message)}`;

        res.redirect(redirectUrl);
    } catch (error) {
        next(error);
    }
};

/**
 * Xử lý IPN (Instant Payment Notification) từ VNPay
 * GET /api/v1/payment/vnpay/ipn
 * 
 * VNPay server gửi IPN đến endpoint này để confirm giao dịch
 * Đây là server-to-server communication, không qua browser
 * 
 * Response: JSON với RspCode để VNPay biết đã nhận được IPN
 */
export const vnpayIPN = async (req: Request, res: Response): Promise<void> => {
    try {
        const vnpParams = req.query;

        const result = await paymentService.handlePaymentCallback('vnpay', vnpParams);

        // Response cho VNPay theo format yêu cầu
        if (result.success) {
            res.status(200).json({
                RspCode: '00',
                Message: 'Confirm Success',
            });
        } else {
            res.status(200).json({
                RspCode: '99',
                Message: 'Confirm Fail',
            });
        }
    } catch (error) {
        // Vẫn phải return 200 cho VNPay, nhưng với RspCode lỗi
        res.status(200).json({
            RspCode: '99',
            Message: 'System Error',
        });
    }
};

/**
 * Xử lý callback từ Momo
 * POST /api/v1/payment/momo/callback
 * 
 * Momo redirect user về URL này sau khi thanh toán
 * Body chứa kết quả thanh toán và chữ ký
 * 
 * Response: Redirect về frontend với kết quả
 */
export const momoCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const momoData = req.body;

        const result = await paymentService.handlePaymentCallback('momo', momoData);

        // Redirect về frontend với kết quả
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/payment/result?success=${result.success}&orderId=${result.orderId}&message=${encodeURIComponent(result.message)}`;

        res.redirect(redirectUrl);
    } catch (error) {
        next(error);
    }
};

/**
 * Xử lý IPN từ Momo
 * POST /api/v1/payment/momo/ipn
 * 
 * Momo server gửi IPN đến endpoint này để confirm giao dịch
 * Server-to-server communication
 * 
 * Response: JSON với resultCode để Momo biết đã nhận được IPN
 */
export const momoIPN = async (req: Request, res: Response): Promise<void> => {
    try {
        const momoData = req.body;

        const result = await paymentService.handlePaymentCallback('momo', momoData);

        // Response cho Momo theo format yêu cầu
        if (result.success) {
            res.status(200).json({
                resultCode: 0,
                message: 'Success',
            });
        } else {
            res.status(200).json({
                resultCode: 1,
                message: 'Failed',
            });
        }
    } catch (error) {
        // Vẫn phải return 200 cho Momo
        res.status(200).json({
            resultCode: 1,
            message: 'System Error',
        });
    }
};

/**
 * Lấy trạng thái thanh toán của một order
 * GET /api/v1/payment/status/:orderId
 * 
 * Params:
 * - orderId: ID của order
 * 
 * Response:
 * - payment: Thông tin payment của order
 */
export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { orderId } = req.params;

        const payment = await paymentService.getPaymentByOrderId(orderId, userId);

        if (!payment) {
            res.status(404).json(ApiResponse.success('Payment not found', null));
            return;
        }

        res.status(200).json(
            ApiResponse.success('Payment status retrieved successfully', { payment })
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Lấy lịch sử thanh toán của user
 * GET /api/v1/payment/history
 * 
 * Query params:
 * - page: Trang hiện tại (default: 1)
 * - limit: Số lượng items per page (default: 10)
 * 
 * Response:
 * - payments: Danh sách payments
 * - pagination: Thông tin phân trang
 */
export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await paymentService.getPaymentHistory(userId, page, limit);

        res.status(200).json(
            ApiResponse.success('Payment history retrieved successfully', result.payments, result.pagination)
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Hủy payment (nếu chưa thành công)
 * POST /api/v1/payment/cancel/:orderId
 * 
 * Params:
 * - orderId: ID của order
 * 
 * Response:
 * - payment: Payment đã được cập nhật
 */
export const cancelPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { orderId } = req.params;

        const payment = await paymentService.cancelPayment(orderId, userId);

        res.status(200).json(
            ApiResponse.success('Payment cancelled successfully', { payment })
        );
    } catch (error) {
        next(error);
    }
};
