import Cart, { ICart, ICartItem } from '../models/Cart.model';
import Product from '../models/Product.model';
import { ApiError } from '../utils/ApiError';

class CartService {
    async getCart(userId: string): Promise<ICart> {
        let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images stock isActive');

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        return cart;
    }

    async addToCart(userId: string, productId: string, quantity: number = 1, variant?: string): Promise<ICart> {
        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            throw ApiError.notFound('Product not found');
        }

        // Check stock
        if (product.stock < quantity) {
            throw ApiError.badRequest('Insufficient stock');
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.variant === variant
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (product.stock < newQuantity) {
                throw ApiError.badRequest('Insufficient stock');
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = product.price;
        } else {
            // Add new item
            cart.items.push({
                product: productId as any,
                variant,
                quantity,
                price: product.price,
            });
        }

        await cart.save();
        await cart.populate('items.product', 'name price images stock isActive');

        return cart;
    }

    async updateCartItem(userId: string, productId: string, quantity: number, variant?: string): Promise<ICart> {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw ApiError.notFound('Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.variant === variant
        );

        if (itemIndex === -1) {
            throw ApiError.notFound('Item not found in cart');
        }

        // Check stock
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            throw ApiError.notFound('Product not found');
        }

        if (product.stock < quantity) {
            throw ApiError.badRequest('Insufficient stock');
        }

        if (quantity <= 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].price = product.price;
        }

        await cart.save();
        await cart.populate('items.product', 'name price images stock isActive');

        return cart;
    }

    async removeFromCart(userId: string, productId: string, variant?: string): Promise<ICart> {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw ApiError.notFound('Cart not found');
        }

        cart.items = cart.items.filter(
            (item) => !(item.product.toString() === productId && item.variant === variant)
        );

        await cart.save();
        await cart.populate('items.product', 'name price images stock isActive');

        return cart;
    }

    async clearCart(userId: string): Promise<ICart> {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw ApiError.notFound('Cart not found');
        }

        cart.items = [];
        await cart.save();

        return cart;
    }
}

export default new CartService();
