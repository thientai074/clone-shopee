import Joi from 'joi';

export const registerSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        name: Joi.string().min(2).required(),
        role: Joi.string().valid('buyer', 'seller').default('buyer'),
    }),
});

export const loginSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
});

export const refreshTokenSchema = Joi.object({
    body: Joi.object({
        refreshToken: Joi.string().required(),
    }),
});

export const verifyEmailSchema = Joi.object({
    body: Joi.object({
        token: Joi.string().required(),
    }),
});

export const requestPasswordResetSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
    }),
});

export const resetPasswordSchema = Joi.object({
    body: Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
    }),
});
