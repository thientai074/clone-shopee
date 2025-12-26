import Joi from 'joi';

export const createProductSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().required(),
        slug: Joi.string().required(),
        description: Joi.string().required(),
        category: Joi.string().required(),
        images: Joi.array().items(Joi.string()).min(1).required(),
        price: Joi.number().min(0).required(),
        originalPrice: Joi.number().min(0),
        stock: Joi.number().min(0).required(),
        variants: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                price: Joi.number().min(0).required(),
                stock: Joi.number().min(0).required(),
                sku: Joi.string(),
                attributes: Joi.object(),
            })
        ),
        tags: Joi.array().items(Joi.string()),
        specifications: Joi.object(),
    }),
});

export const updateProductSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        category: Joi.string(),
        images: Joi.array().items(Joi.string()),
        price: Joi.number().min(0),
        originalPrice: Joi.number().min(0),
        stock: Joi.number().min(0),
        variants: Joi.array(),
        tags: Joi.array().items(Joi.string()),
        specifications: Joi.object(),
        isActive: Joi.boolean(),
    }),
});

export const getProductsSchema = Joi.object({
    query: Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(20),
        sort: Joi.string().valid('createdAt', 'price', 'sold', 'rating').default('createdAt'),
        order: Joi.string().valid('asc', 'desc').default('desc'),
        category: Joi.string(),
        minPrice: Joi.number().min(0),
        maxPrice: Joi.number().min(0),
        search: Joi.string(),
        seller: Joi.string(),
        rating: Joi.number().min(0).max(5),
    }),
});
