import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent?: mongoose.Types.ObjectId;
    level: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        level: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
