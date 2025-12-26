import Joi from 'joi';

export const createOrderSchema = Joi.object({
    body: Joi.object({
        items: Joi.array()
            .items(
                Joi.object({
                    product: Joi.string().required(),
                    variant: Joi.string(),
                    quantity: Joi.number().min(1).required(),
                })
            )
            .min(1)
            .required(),
        shippingAddress: Joi.object({
            fullName: Joi.string().required(),
            phone: Joi.string().required(),
            address: Joi.string().required(),
            city: Joi.string().required(),
            district: Joi.string().required(),
            ward: Joi.string().required(),
        }).required(),
        paymentMethod: Joi.string().valid('cod', 'card', 'e-wallet').required(),
        note: Joi.string(),
    }),
});

export const updateOrderStatusSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        status: Joi.string()
            .valid('confirmed', 'processing', 'shipping', 'delivered', 'cancelled')
            .required(),
    }),
});

export const cancelOrderSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        reason: Joi.string().required(),
    }),
});
