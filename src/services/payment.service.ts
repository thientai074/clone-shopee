import Payment, { IPayment } from '../models/Payment.model';
import Order from '../models/Order.model';
import vnpayService from './vnpay.service';
import momoService from './momo.service';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

/**
 * Payment Service
 * Service tổng hợp để xử lý các giao dịch thanh toán
 * Điều phối giữa các payment gateway (VNPay, Momo) và database
 */

interface InitiatePaymentParams {
    orderId: string;
    userId: string;
    paymentMethod: 'vnpay' | 'momo' | 'bank-card';
    ipAddress: string;
    bankCode?: string;
}

class PaymentService {
    /**
     * Khởi tạo thanh toán cho một order
     * Tạo payment record và generate payment URL
     * 
     * @param params - Thông tin thanh toán
     * @returns Payment URL và payment record
     */
    async initiatePayment(params: InitiatePaymentParams): Promise<{
        paymentUrl?: string;
        deeplink?: string;
        qrCodeUrl?: string;
        payment: IPayment;
    }> {
        const { orderId, userId, paymentMethod, ipAddress, bankCode } = params;

        // Kiểm tra order có tồn tại không
        const order = await Order.findById(orderId);
        if (!order) {
            throw new ApiError(404, 'Order not found');
        }

        // Kiểm tra order có thuộc về user không
        if (order.user.toString() !== userId) {
            throw new ApiError(403, 'Unauthorized to access this order');
        }

        // Kiểm tra order đã thanh toán chưa
        if (order.paymentStatus === 'paid') {
            throw new ApiError(400, 'Order has already been paid');
        }

        // Kiểm tra order có bị hủy không
        if (order.orderStatus === 'cancelled') {
            throw new ApiError(400, 'Cannot pay for cancelled order');
        }

        // Tạo payment record
        const payment = await Payment.create({
            orderId: order._id,
            userId: new mongoose.Types.ObjectId(userId),
            amount: order.totalAmount,
            paymentMethod,
            status: 'pending',
            ipAddress,
        });

        let paymentUrl: string | undefined;
        let deeplink: string | undefined;
        let qrCodeUrl: string | undefined;

        // Generate payment URL dựa vào payment method
        if (paymentMethod === 'vnpay') {
            paymentUrl = vnpayService.createPaymentUrl({
                orderId: order._id.toString(),
                amount: order.totalAmount,
                orderInfo: `Thanh toan don hang ${order.orderNumber}`,
                ipAddr: ipAddress,
                bankCode,
            });

            // Cập nhật payment record với payment URL
            payment.paymentUrl = paymentUrl;
            payment.paymentGateway = 'vnpay';
            await payment.save();

            // Cập nhật order với payment details
            order.paymentDetails = {
                paymentUrl,
                paymentGateway: 'vnpay',
            };
            await order.save();

        } else if (paymentMethod === 'momo') {
            const momoResult = await momoService.createPaymentUrl({
                orderId: order._id.toString(),
                amount: order.totalAmount,
                orderInfo: `Thanh toan don hang ${order.orderNumber}`,
            });

            if (!momoResult.success) {
                // Cập nhật payment status thành failed
                payment.status = 'failed';
                payment.failureReason = momoResult.message;
                await payment.save();

                throw new ApiError(500, momoResult.message);
            }

            paymentUrl = momoResult.payUrl;
            deeplink = momoResult.deeplink;
            qrCodeUrl = momoResult.qrCodeUrl;

            // Cập nhật payment record
            payment.paymentUrl = paymentUrl;
            payment.paymentGateway = 'momo';
            payment.status = 'processing';
            await payment.save();

            // Cập nhật order với payment details
            order.paymentDetails = {
                paymentUrl,
                paymentGateway: 'momo',
            };
            await order.save();

        } else if (paymentMethod === 'bank-card') {
            // Bank card payment sẽ được xử lý tương tự VNPay
            // Có thể sử dụng VNPay với bankCode cụ thể
            paymentUrl = vnpayService.createPaymentUrl({
                orderId: order._id.toString(),
                amount: order.totalAmount,
                orderInfo: `Thanh toan don hang ${order.orderNumber}`,
                ipAddr: ipAddress,
                bankCode: bankCode || 'VNBANK', // Default bank code
            });

            payment.paymentUrl = paymentUrl;
            payment.paymentGateway = 'vnpay';
            await payment.save();

            order.paymentDetails = {
                paymentUrl,
                paymentGateway: 'vnpay',
            };
            await order.save();
        }

        return {
            paymentUrl,
            deeplink,
            qrCodeUrl,
            payment,
        };
    }

    /**
     * Xử lý callback từ payment gateway
     * Cập nhật trạng thái payment và order
     * 
     * @param method - Payment method (vnpay/momo)
     * @param data - Callback data từ gateway
     * @returns Kết quả xử lý
     */
    async handlePaymentCallback(
        method: 'vnpay' | 'momo',
        data: any
    ): Promise<{
        success: boolean;
        message: string;
        orderId?: string;
    }> {
        try {
            let verifyResult: any;
            let orderId: string;
            let transactionId: string;
            let isSuccess: boolean;

            if (method === 'vnpay') {
                verifyResult = vnpayService.verifyReturnUrl(data);
                if (!verifyResult.isValid) {
                    throw new ApiError(400, verifyResult.message);
                }

                orderId = verifyResult.data.orderId;
                transactionId = verifyResult.data.transactionNo;
                isSuccess = verifyResult.data.isSuccess;

            } else if (method === 'momo') {
                verifyResult = momoService.verifyCallback(data);
                if (!verifyResult.isValid) {
                    throw new ApiError(400, verifyResult.message);
                }

                orderId = verifyResult.data.orderId;
                transactionId = verifyResult.data.transactionId;
                isSuccess = verifyResult.data.isSuccess;
            } else {
                throw new ApiError(400, 'Invalid payment method');
            }

            // Tìm payment record
            const payment = await Payment.findOne({ orderId });
            if (!payment) {
                throw new ApiError(404, 'Payment not found');
            }

            // Cập nhật payment status
            payment.transactionId = transactionId;
            payment.gatewayResponse = data;

            if (isSuccess) {
                payment.status = 'success';
                payment.paidAt = new Date();
            } else {
                payment.status = 'failed';
                payment.failureReason = verifyResult.message;
            }

            await payment.save();

            // Cập nhật order
            const order = await Order.findById(orderId);
            if (order) {
                if (isSuccess) {
                    order.paymentStatus = 'paid';
                    order.paidAt = new Date();
                    order.orderStatus = 'confirmed';
                } else {
                    order.paymentStatus = 'failed';
                }

                if (order.paymentDetails) {
                    order.paymentDetails.transactionId = transactionId;
                    order.paymentDetails.paymentData = data;
                }

                await order.save();
            }

            return {
                success: isSuccess,
                message: verifyResult.message,
                orderId,
            };

        } catch (error: any) {
            console.error('handlePaymentCallback error:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin payment của một order
     * 
     * @param orderId - Order ID
     * @param userId - User ID (để verify ownership)
     * @returns Payment information
     */
    async getPaymentByOrderId(orderId: string, userId?: string): Promise<IPayment | null> {
        const payment = await Payment.findOne({ orderId })
            .populate('orderId', 'orderNumber totalAmount')
            .populate('userId', 'name email');

        if (!payment) {
            return null;
        }

        // Verify ownership nếu có userId
        if (userId && payment.userId.toString() !== userId) {
            throw new ApiError(403, 'Unauthorized to access this payment');
        }

        return payment;
    }

    /**
     * Lấy lịch sử thanh toán của user
     * 
     * @param userId - User ID
     * @param page - Trang hiện tại
     * @param limit - Số lượng items per page
     * @returns Danh sách payments và pagination info
     */
    async getPaymentHistory(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        payments: IPayment[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }> {
        const skip = (page - 1) * limit;

        const [payments, totalItems] = await Promise.all([
            Payment.find({ userId })
                .populate('orderId', 'orderNumber totalAmount orderStatus')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Payment.countDocuments({ userId }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            payments,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Hủy payment (nếu chưa thành công)
     * 
     * @param orderId - Order ID
     * @param userId - User ID
     * @returns Updated payment
     */
    async cancelPayment(orderId: string, userId: string): Promise<IPayment> {
        const payment = await Payment.findOne({ orderId, userId });

        if (!payment) {
            throw new ApiError(404, 'Payment not found');
        }

        if (payment.status === 'success') {
            throw new ApiError(400, 'Cannot cancel successful payment');
        }

        if (payment.status === 'cancelled') {
            throw new ApiError(400, 'Payment already cancelled');
        }

        payment.status = 'cancelled';
        payment.cancelledAt = new Date();
        await payment.save();

        return payment;
    }
}

export default new PaymentService();
