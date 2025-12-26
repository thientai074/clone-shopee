import { Request, Response, NextFunction } from 'express';
import cartService from '../services/cart.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const cart = await cartService.getCart(userId);

        res.json(ApiResponse.success('Cart retrieved successfully', { cart }));
    } catch (error) {
        next(error);
    }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { productId, quantity, variant } = req.body;
        const cart = await cartService.addToCart(userId, productId, quantity, variant);

        res.json(ApiResponse.success('Item added to cart', { cart }));
    } catch (error) {
        next(error);
    }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { productId, quantity, variant } = req.body;
        const cart = await cartService.updateCartItem(userId, productId, quantity, variant);

        res.json(ApiResponse.success('Cart updated successfully', { cart }));
    } catch (error) {
        next(error);
    }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { productId } = req.params;
        const { variant } = req.query;
        const cart = await cartService.removeFromCart(userId, productId, variant as string);

        res.json(ApiResponse.success('Item removed from cart', { cart }));
    } catch (error) {
        next(error);
    }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const cart = await cartService.clearCart(userId);

        res.json(ApiResponse.success('Cart cleared successfully', { cart }));
    } catch (error) {
        next(error);
    }
};
