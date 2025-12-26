import { Request, Response, NextFunction } from 'express';
import productService from '../services/product.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';
import { uploadToCloudinary } from '../config/cloudinary';

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sellerId = (req as AuthRequest).user!._id;
        const product = await productService.createProduct(sellerId, req.body);

        res.status(201).json(ApiResponse.created('Product created successfully', { product }));
    } catch (error) {
        next(error);
    }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await productService.getProducts(req.query);

        res.json(
            ApiResponse.success('Products retrieved successfully', result.products, result.pagination)
        );
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const product = await productService.getProductById(req.params.id);

        res.json(ApiResponse.success('Product retrieved successfully', { product }));
    } catch (error) {
        next(error);
    }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const product = await productService.getProductBySlug(req.params.slug);

        res.json(ApiResponse.success('Product retrieved successfully', { product }));
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sellerId = (req as AuthRequest).user!._id;
        const product = await productService.updateProduct(req.params.id, sellerId, req.body);

        res.json(ApiResponse.success('Product updated successfully', { product }));
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sellerId = (req as AuthRequest).user!._id;
        await productService.deleteProduct(req.params.id, sellerId);

        res.json(ApiResponse.success('Product deleted successfully'));
    } catch (error) {
        next(error);
    }
};

export const uploadProductImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json(ApiResponse.success('No files uploaded', null));
            return;
        }

        const uploadPromises = req.files.map((file) => uploadToCloudinary(file, 'products'));
        const results = await Promise.all(uploadPromises);
        const imageUrls = results.map((result) => result.url);

        res.json(ApiResponse.success('Images uploaded successfully', { images: imageUrls }));
    } catch (error) {
        next(error);
    }
};
