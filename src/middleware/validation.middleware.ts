import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(
            {
                body: req.body,
                query: req.query,
                params: req.params,
            },
            {
                abortEarly: false,
                stripUnknown: true,
            }
        );

        if (error) {
            const errorMessage = error.details
                .map((detail) => detail.message)
                .join(', ');
            throw ApiError.badRequest(errorMessage);
        }

        // Replace request data with validated data
        req.body = value.body || req.body;
        req.query = value.query || req.query;
        req.params = value.params || req.params;

        next();
    };
};
