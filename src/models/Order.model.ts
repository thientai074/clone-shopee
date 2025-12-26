import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    name: string;
    image: string;
    variant?: string;
    quantity: number;
    price: number;
    seller: mongoose.Types.ObjectId;
}

export interface IShippingAddress {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
}

export interface IPaymentDetails {
    transactionId?: string;
    paymentGateway?: 'vnpay' | 'momo';
    paymentData?: any;
    paymentUrl?: string;
}

export interface IOrder extends Document {
    orderNumber: string;
    user: mongoose.Types.ObjectId;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    paymentMethod: 'cod' | 'vnpay' | 'momo' | 'bank-card';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentDetails?: IPaymentDetails;
    orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
    note?: string;
    cancelReason?: string;
    paidAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    variant: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (v: IOrderItem[]) => v.length > 0,
                message: 'Order must have at least one item',
            },
        },
        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'vnpay', 'momo', 'bank-card'],
            required: true,
        },
        paymentDetails: {
            transactionId: String,
            paymentGateway: {
                type: String,
                enum: ['vnpay', 'momo'],
            },
            paymentData: Schema.Types.Mixed,
            paymentUrl: String,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
            index: true,
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
            default: 'pending',
            index: true,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        note: String,
        cancelReason: String,
        paidAt: Date,
        deliveredAt: Date,
    },
    {
        timestamps: true,
    }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderNumber = `ORD-${timestamp}-${random}`;
    }
    next();
});

// Indexes for common queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
