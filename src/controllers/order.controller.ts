import { Request, Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { items, shippingAddress, paymentMethod, note } = req.body;
        const order = await orderService.createOrder(userId, items, shippingAddress, paymentMethod, note);

        res.status(201).json(ApiResponse.created('Order created successfully', { order }));
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await orderService.getOrders(userId, page, limit);

        res.json(ApiResponse.success('Orders retrieved successfully', result.orders, result.pagination));
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const order = await orderService.getOrderById(req.params.id, userId);

        res.json(ApiResponse.success('Order retrieved successfully', { order }));
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status } = req.body;
        const order = await orderService.updateOrderStatus(req.params.id, status);

        res.json(ApiResponse.success('Order status updated successfully', { order }));
    } catch (error) {
        next(error);
    }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { reason } = req.body;
        const order = await orderService.cancelOrder(req.params.id, userId, reason);

        res.json(ApiResponse.success('Order cancelled successfully', { order }));
    } catch (error) {
        next(error);
    }
};

export const getSellerOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sellerId = (req as AuthRequest).user!._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await orderService.getSellerOrders(sellerId, page, limit);

        res.json(ApiResponse.success('Seller orders retrieved successfully', result.orders, result.pagination));
    } catch (error) {
        next(error);
    }
};
