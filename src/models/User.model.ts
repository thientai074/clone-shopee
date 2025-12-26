import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    isDefault: boolean;
}

export interface IUser extends Document {
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
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String,
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['buyer', 'seller', 'admin'],
            default: 'buyer',
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        passwordResetToken: String,
        passwordResetExpires: Date,
        addresses: [addressSchema],
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
