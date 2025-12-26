import { Request } from 'express';

export interface IUser {
    _id: string;
    email: string;
    password: string;
    name: string;
    avatar?: string;
    phone?: string;
    role: 'buyer' | 'seller' | 'admin';
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    addresses: IAddress[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IAddress {
    _id?: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    isDefault: boolean;
}

export interface AuthRequest extends Request {
    user?: IUser;
}

export interface IPaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface IProductFilter extends IPaginationQuery {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    seller?: string;
    rating?: number;
}
