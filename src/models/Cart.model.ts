import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
    product: mongoose.Types.ObjectId;
    variant?: string;
    quantity: number;
    price: number;
}

export interface ICart extends Document {
    user: mongoose.Types.ObjectId;
    items: ICartItem[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variant: {
        type: String,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
});

const cartSchema = new Schema<ICart>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        items: [cartItemSchema],
        totalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate total amount before saving
cartSchema.pre('save', function (next) {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
    next();
});

const Cart = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;
