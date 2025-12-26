import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
    name: string;
    price: number;
    stock: number;
    sku?: string;
    attributes: {
        size?: string;
        color?: string;
        [key: string]: any;
    };
}

export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    category: mongoose.Types.ObjectId;
    seller: mongoose.Types.ObjectId;
    images: string[];
    price: number;
    originalPrice?: number;
    variants: IProductVariant[];
    stock: number;
    sold: number;
    rating: number;
    reviewCount: number;
    isActive: boolean;
    tags: string[];
    specifications: Map<string, string>;
    createdAt: Date;
    updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String },
    attributes: {
        type: Map,
        of: Schema.Types.Mixed,
    },
});

const productSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: 'text',
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
            index: 'text',
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        images: {
            type: [String],
            required: true,
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'At least one image is required',
            },
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        originalPrice: {
            type: Number,
            min: 0,
        },
        variants: [productVariantSchema],
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        sold: {
            type: Number,
            default: 0,
            min: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        specifications: {
            type: Map,
            of: String,
        },
    },
    {
        timestamps: true,
    }
);

// Text search index for name and description
productSchema.index({ name: 'text', description: 'text' });

// Compound indexes for common queries
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
productSchema.index({ seller: 1, isActive: 1, createdAt: -1 });
productSchema.index({ price: 1, rating: -1 });
productSchema.index({ sold: -1 });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
