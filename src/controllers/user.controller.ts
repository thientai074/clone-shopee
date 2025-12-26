import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';
import { uploadToCloudinary } from '../config/cloudinary';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const user = await userService.getUserById(userId);

        res.json(ApiResponse.success('Profile retrieved successfully', { user }));
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const user = await userService.updateProfile(userId, req.body);

        res.json(ApiResponse.success('Profile updated successfully', { user }));
    } catch (error) {
        next(error);
    }
};

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json(ApiResponse.success('No file uploaded', null));
            return;
        }

        const userId = (req as AuthRequest).user!._id;
        const { url } = await uploadToCloudinary(req.file, 'avatars');
        const user = await userService.updateProfile(userId, { avatar: url } as any);

        res.json(ApiResponse.success('Avatar uploaded successfully', { user }));
    } catch (error) {
        next(error);
    }
};

export const addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const user = await userService.addAddress(userId, req.body);

        res.status(201).json(ApiResponse.created('Address added successfully', { user }));
    } catch (error) {
        next(error);
    }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { addressId } = req.params;
        const user = await userService.updateAddress(userId, addressId, req.body);

        res.json(ApiResponse.success('Address updated successfully', { user }));
    } catch (error) {
        next(error);
    }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user!._id;
        const { addressId } = req.params;
        const user = await userService.deleteAddress(userId, addressId);

        res.json(ApiResponse.success('Address deleted successfully', { user }));
    } catch (error) {
        next(error);
    }
};
