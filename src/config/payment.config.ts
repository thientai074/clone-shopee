import dotenv from 'dotenv';

dotenv.config();

/**
 * Cấu hình cho VNPay Payment Gateway
 * VNPay là cổng thanh toán điện tử hàng đầu tại Việt Nam
 */
export const vnpayConfig = {
    // Mã định danh merchant do VNPay cấp
    tmnCode: process.env.VNPAY_TMN_CODE || 'VNPAY_TEST',

    // Secret key để tạo và xác thực chữ ký (hash)
    hashSecret: process.env.VNPAY_HASH_SECRET || 'VNPAY_HASH_SECRET_TEST',

    // URL của VNPay gateway (sandbox hoặc production)
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',

    // URL để VNPay redirect về sau khi thanh toán
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payment/vnpay/callback',

    // API version của VNPay
    version: '2.1.0',

    // Command code cho tạo giao dịch thanh toán
    command: 'pay',

    // Loại tiền tệ (VND)
    currencyCode: 'VND',

    // Ngôn ngữ hiển thị (vn hoặc en)
    locale: 'vn',
};

/**
 * Cấu hình cho Momo E-Wallet
 * Momo là ví điện tử phổ biến nhất tại Việt Nam
 */
export const momoConfig = {
    // Partner Code do Momo cấp
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER_CODE_TEST',

    // Access Key để xác thực
    accessKey: process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY_TEST',

    // Secret Key để tạo chữ ký
    secretKey: process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY_TEST',

    // Endpoint API của Momo (sandbox hoặc production)
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',

    // URL để Momo redirect về sau khi thanh toán
    returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:5000/api/v1/payment/momo/callback',

    // URL để Momo gửi IPN (Instant Payment Notification)
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/v1/payment/momo/ipn',

    // Request type cho thanh toán
    requestType: 'captureWallet',

    // Extra data (optional)
    extraData: '',

    // Auto capture (true: tự động capture, false: cần confirm)
    autoCapture: true,

    // Language
    lang: 'vi',
};

/**
 * Cấu hình chung cho payment system
 */
export const paymentConfig = {
    // Timeout cho payment session (30 phút)
    paymentTimeout: 30 * 60 * 1000,

    // Số lần retry khi gọi API thất bại
    maxRetries: 3,

    // Delay giữa các lần retry (ms)
    retryDelay: 1000,

    // Các payment method được hỗ trợ
    supportedMethods: ['cod', 'vnpay', 'momo', 'bank-card'] as const,

    // Payment status
    paymentStatus: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        SUCCESS: 'success',
        FAILED: 'failed',
        CANCELLED: 'cancelled',
        REFUNDED: 'refunded',
    } as const,
};

export type PaymentMethod = typeof paymentConfig.supportedMethods[number];
export type PaymentStatus = typeof paymentConfig.paymentStatus[keyof typeof paymentConfig.paymentStatus];
