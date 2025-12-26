import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    product: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    images: string[];
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        images: {
            type: [String],
            default: [],
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
        helpfulCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one review per user per product per order
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
