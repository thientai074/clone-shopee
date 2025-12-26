import Product, { IProduct } from '../models/Product.model';
import Review from '../models/Review.model';
import { ApiError } from '../utils/ApiError';
import { IProductFilter } from '../types';
import cacheService from './cache.service';

class ProductService {
    async createProduct(sellerId: string, data: Partial<IProduct>): Promise<IProduct> {
        const product = await Product.create({
            ...data,
            seller: sellerId,
        });

        // Clear product cache
        await cacheService.deletePattern('cache:/api/v1/products*');

        return product;
    }

    async getProducts(filters: IProductFilter) {
        const {
            page = 1,
            limit = 20,
            sort = 'createdAt',
            order = 'desc',
            category,
            minPrice,
            maxPrice,
            search,
            seller,
            rating,
        } = filters;

        const query: any = { isActive: true };

        // Apply filters
        if (category) query.category = category;
        if (seller) query.seller = seller;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }
        if (rating) query.rating = { $gte: rating };
        if (search) {
            query.$text = { $search: search };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === 'asc' ? 1 : -1;

        // Execute query with pagination
        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ [sort]: sortOrder })
                .skip(skip)
                .limit(limit)
                .populate('category', 'name slug')
                .populate('seller', 'name avatar')
                .lean(),
            Product.countDocuments(query),
        ]);

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getProductById(productId: string): Promise<IProduct> {
        const product = await Product.findById(productId)
            .populate('category', 'name slug')
            .populate('seller', 'name avatar');

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        return product;
    }

    async getProductBySlug(slug: string): Promise<IProduct> {
        const product = await Product.findOne({ slug, isActive: true })
            .populate('category', 'name slug')
            .populate('seller', 'name avatar');

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        return product;
    }

    async updateProduct(productId: string, sellerId: string, data: Partial<IProduct>): Promise<IProduct> {
        const product = await Product.findById(productId);

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        if (product.seller.toString() !== sellerId) {
            throw ApiError.forbidden('You can only update your own products');
        }

        Object.assign(product, data);
        await product.save();

        // Clear cache
        await cacheService.deletePattern('cache:/api/v1/products*');

        return product;
    }

    async deleteProduct(productId: string, sellerId: string): Promise<void> {
        const product = await Product.findById(productId);

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        if (product.seller.toString() !== sellerId) {
            throw ApiError.forbidden('You can only delete your own products');
        }

        // Soft delete
        product.isActive = false;
        await product.save();

        // Clear cache
        await cacheService.deletePattern('cache:/api/v1/products*');
    }

    async updateProductRating(productId: string): Promise<void> {
        const reviews = await Review.find({ product: productId });

        if (reviews.length === 0) {
            await Product.findByIdAndUpdate(productId, {
                rating: 0,
                reviewCount: 0,
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length,
        });

        // Clear cache
        await cacheService.deletePattern(`cache:/api/v1/products/${productId}*`);
    }
}

export default new ProductService();
