import Joi from 'joi';

/**
 * Validation schema cho khởi tạo thanh toán
 */
export const initiatePaymentSchema = Joi.object({
    // Order ID cần thanh toán
    orderId: Joi.string()
        .required()
        .messages({
            'string.empty': 'Order ID is required',
            'any.required': 'Order ID is required',
        }),

    // Phương thức thanh toán
    paymentMethod: Joi.string()
        .valid('vnpay', 'momo', 'bank-card')
        .required()
        .messages({
            'string.empty': 'Payment method is required',
            'any.required': 'Payment method is required',
            'any.only': 'Payment method must be one of: vnpay, momo, bank-card',
        }),

    // Mã ngân hàng (optional, cho VNPay)
    bankCode: Joi.string()
        .optional()
        .allow('')
        .messages({
            'string.base': 'Bank code must be a string',
        }),
});

/**
 * Validation schema cho VNPay callback
 * VNPay gửi các tham số với prefix vnp_
 */
export const vnpayCallbackSchema = Joi.object({
    vnp_TmnCode: Joi.string().required(),
    vnp_Amount: Joi.string().required(),
    vnp_BankCode: Joi.string().allow(''),
    vnp_BankTranNo: Joi.string().allow(''),
    vnp_CardType: Joi.string().allow(''),
    vnp_PayDate: Joi.string().required(),
    vnp_OrderInfo: Joi.string().required(),
    vnp_TransactionNo: Joi.string().required(),
    vnp_ResponseCode: Joi.string().required(),
    vnp_TransactionStatus: Joi.string().required(),
    vnp_TxnRef: Joi.string().required(),
    vnp_SecureHashType: Joi.string().required(),
    vnp_SecureHash: Joi.string().required(),
}).unknown(true); // Allow other fields

/**
 * Validation schema cho Momo callback
 */
export const momoCallbackSchema = Joi.object({
    partnerCode: Joi.string().required(),
    orderId: Joi.string().required(),
    requestId: Joi.string().required(),
    amount: Joi.number().required(),
    orderInfo: Joi.string().required(),
    orderType: Joi.string().required(),
    transId: Joi.string().required(),
    resultCode: Joi.number().required(),
    message: Joi.string().required(),
    payType: Joi.string().required(),
    responseTime: Joi.number().required(),
    extraData: Joi.string().allow(''),
    signature: Joi.string().required(),
}).unknown(true);
