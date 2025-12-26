import Order, { IOrder, IOrderItem } from '../models/Order.model';
import Product from '../models/Product.model';
import Cart from '../models/Cart.model';
import { ApiError } from '../utils/ApiError';
import emailService from './email.service';

class OrderService {
    async createOrder(
        userId: string,
        items: Array<{ product: string; variant?: string; quantity: number }>,
        shippingAddress: any,
        paymentMethod: 'cod' | 'card' | 'e-wallet',
        note?: string
    ): Promise<IOrder> {
        // Validate and prepare order items
        const orderItems: IOrderItem[] = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product || !product.isActive) {
                throw ApiError.notFound(`Product ${item.product} not found`);
            }

            if (product.stock < item.quantity) {
                throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.images[0],
                variant: item.variant,
                quantity: item.quantity,
                price: product.price,
                seller: product.seller,
            });

            // Decrease stock and increase sold count
            product.stock -= item.quantity;
            product.sold += item.quantity;
            await product.save();
        }

        // Calculate shipping fee (simplified)
        const shippingFee = subtotal >= 500000 ? 0 : 30000; // Free shipping over 500k VND
        const totalAmount = subtotal + shippingFee;

        // Create order
        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            shippingFee,
            totalAmount,
            note,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            orderStatus: 'pending',
        });

        // Clear user's cart
        await Cart.findOneAndUpdate({ user: userId }, { items: [] });

        // Send order confirmation email
        const user = await (await order.populate('user', 'email')).user;
        await emailService.sendOrderConfirmation((user as any).email, order.orderNumber, totalAmount);

        return order;
    }

    async getOrders(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ user: userId }),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getOrderById(orderId: string, userId: string): Promise<IOrder> {
        const order = await Order.findById(orderId);

        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        if (order.user.toString() !== userId) {
            throw ApiError.forbidden('You can only view your own orders');
        }

        return order;
    }

    async updateOrderStatus(
        orderId: string,
        status: 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
    ): Promise<IOrder> {
        const order = await Order.findById(orderId);

        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        if (order.orderStatus === 'cancelled' || order.orderStatus === 'delivered') {
            throw ApiError.badRequest('Cannot update cancelled or delivered orders');
        }

        order.orderStatus = status;

        if (status === 'delivered') {
            order.deliveredAt = new Date();
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
        }

        await order.save();
        return order;
    }

    async cancelOrder(orderId: string, userId: string, reason: string): Promise<IOrder> {
        const order = await Order.findById(orderId);

        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        if (order.user.toString() !== userId) {
            throw ApiError.forbidden('You can only cancel your own orders');
        }

        if (order.orderStatus === 'shipping' || order.orderStatus === 'delivered') {
            throw ApiError.badRequest('Cannot cancel orders that are shipping or delivered');
        }

        if (order.orderStatus === 'cancelled') {
            throw ApiError.badRequest('Order is already cancelled');
        }

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity, sold: -item.quantity },
            });
        }

        order.orderStatus = 'cancelled';
        order.cancelReason = reason;
        await order.save();

        return order;
    }

    async getSellerOrders(sellerId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ 'items.seller': sellerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ 'items.seller': sellerId }),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default new OrderService();
