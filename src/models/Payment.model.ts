import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface cho Payment Transaction
 * Lưu trữ thông tin chi tiết về mỗi giao dịch thanh toán
 */
export interface IPayment extends Document {
    // Reference đến Order
    orderId: mongoose.Types.ObjectId;

    // Reference đến User thực hiện thanh toán
    userId: mongoose.Types.ObjectId;

    // Số tiền thanh toán (VND)
    amount: number;

    // Phương thức thanh toán: COD, VNPay, Momo, Bank Card
    paymentMethod: 'cod' | 'vnpay' | 'momo' | 'bank-card';

    // Trạng thái thanh toán
    status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';

    // Mã giao dịch từ payment gateway (VNPay transaction ID, Momo transaction ID, etc.)
    transactionId?: string;

    // Tên payment gateway (vnpay, momo)
    paymentGateway?: string;

    // Response data từ payment gateway (lưu toàn bộ response để trace)
    gatewayResponse?: any;

    // URL thanh toán (nếu có - cho VNPay, Momo)
    paymentUrl?: string;

    // IP address của người thực hiện thanh toán
    ipAddress?: string;

    // Thông tin thẻ (nếu thanh toán bằng thẻ) - chỉ lưu 4 số cuối
    cardInfo?: {
        cardType?: string; // VISA, MASTERCARD, JCB, etc.
        lastFourDigits?: string; // 4 số cuối
        bankCode?: string; // Mã ngân hàng
    };

    // Thời gian thanh toán thành công
    paidAt?: Date;

    // Thời gian hủy giao dịch
    cancelledAt?: Date;

    // Lý do hủy hoặc thất bại
    failureReason?: string;

    // Metadata bổ sung
    metadata?: {
        userAgent?: string;
        deviceInfo?: string;
        [key: string]: any;
    };

    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'vnpay', 'momo', 'bank-card'],
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
            default: 'pending',
            index: true,
        },
        transactionId: {
            type: String,
            index: true,
            sparse: true, // Cho phép null, nhưng nếu có thì phải unique
        },
        paymentGateway: {
            type: String,
            enum: ['vnpay', 'momo', null],
        },
        gatewayResponse: {
            type: Schema.Types.Mixed,
        },
        paymentUrl: {
            type: String,
        },
        ipAddress: {
            type: String,
        },
        cardInfo: {
            cardType: String,
            lastFourDigits: String,
            bankCode: String,
        },
        paidAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        failureReason: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes để tối ưu query
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });

// Virtual để check xem payment có thành công không
paymentSchema.virtual('isSuccessful').get(function () {
    return this.status === 'success';
});

// Virtual để check xem payment có đang pending không
paymentSchema.virtual('isPending').get(function () {
    return this.status === 'pending' || this.status === 'processing';
});

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
