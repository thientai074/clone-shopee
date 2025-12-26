import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    user: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;
