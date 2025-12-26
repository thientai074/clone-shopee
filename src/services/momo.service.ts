import crypto from 'crypto';
import axios from 'axios';
import { momoConfig } from '../config/payment.config';

/**
 * Momo Service
 * Xử lý tích hợp với ví điện tử Momo
 * 
 * Momo flow:
 * 1. Gửi request tạo payment đến Momo API
 * 2. Nhận payUrl từ Momo
 * 3. Redirect user đến payUrl
 * 4. User thực hiện thanh toán trên Momo app/web
 * 5. Momo redirect về returnUrl với kết quả
 * 6. Momo gửi IPN để confirm giao dịch
 */

interface MomoPaymentParams {
    orderId: string;
    amount: number;
    orderInfo: string;
    extraData?: string;
}

interface MomoPaymentResponse {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    responseTime: number;
    message: string;
    resultCode: number;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
}

interface MomoCallbackData {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: string;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
}

class MomoService {
    /**
     * Tạo chữ ký (signature) cho request
     * Momo sử dụng HMAC SHA256
     */
    private createSignature(rawData: string): string {
        const hmac = crypto.createHmac('sha256', momoConfig.secretKey);
        const signature = hmac.update(rawData).digest('hex');
        return signature;
    }

    /**
     * Tạo request ID unique cho mỗi request
     */
    private generateRequestId(): string {
        return `${momoConfig.partnerCode}${Date.now()}`;
    }

    /**
     * Tạo payment request đến Momo
     * 
     * @param orderId - Mã đơn hàng
     * @param amount - Số tiền (VND)
     * @param orderInfo - Thông tin đơn hàng
     * @param extraData - Dữ liệu bổ sung (optional)
     * @returns Payment URL để redirect user
     */
    async createPaymentUrl(params: MomoPaymentParams): Promise<{
        success: boolean;
        message: string;
        payUrl?: string;
        deeplink?: string;
        qrCodeUrl?: string;
        requestId?: string;
    }> {
        try {
            const { orderId, amount, orderInfo, extraData = '' } = params;

            const requestId = this.generateRequestId();

            // Tạo raw signature theo format của Momo
            // Format: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.returnUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;

            const signature = this.createSignature(rawSignature);

            // Tạo request body
            const requestBody = {
                partnerCode: momoConfig.partnerCode,
                partnerName: 'Shopee Clone',
                storeId: 'ShopeeCloneStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl: momoConfig.returnUrl,
                ipnUrl: momoConfig.ipnUrl,
                lang: momoConfig.lang,
                requestType: momoConfig.requestType,
                autoCapture: momoConfig.autoCapture,
                extraData,
                signature,
            };

            // Gửi request đến Momo API
            const response = await axios.post<MomoPaymentResponse>(
                momoConfig.endpoint,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 seconds timeout
                }
            );

            const { resultCode, message, payUrl, deeplink, qrCodeUrl } = response.data;

            // resultCode = 0: Success
            // resultCode != 0: Failed
            if (resultCode === 0) {
                return {
                    success: true,
                    message: 'Payment URL created successfully',
                    payUrl,
                    deeplink,
                    qrCodeUrl,
                    requestId,
                };
            } else {
                return {
                    success: false,
                    message: message || 'Failed to create payment URL',
                };
            }
        } catch (error: any) {
            console.error('Momo createPaymentUrl error:', error);
            return {
                success: false,
                message: error.message || 'Error connecting to Momo',
            };
        }
    }

    /**
     * Xác thực callback từ Momo
     * Kiểm tra signature để đảm bảo response từ Momo là hợp lệ
     * 
     * @param callbackData - Data từ Momo callback
     * @returns Kết quả xác thực
     */
    verifyCallback(callbackData: MomoCallbackData): {
        isValid: boolean;
        message: string;
        data?: {
            orderId: string;
            amount: number;
            transactionId: string;
            resultCode: number;
            isSuccess: boolean;
        };
    } {
        try {
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature,
            } = callbackData;

            // Tạo raw signature để verify
            // Format: accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&payType=$payType&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
            const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

            const calculatedSignature = this.createSignature(rawSignature);

            // Verify signature
            if (signature !== calculatedSignature) {
                return {
                    isValid: false,
                    message: 'Invalid signature - Chữ ký không hợp lệ',
                };
            }

            // resultCode = 0: Thành công
            // resultCode != 0: Thất bại
            const isSuccess = resultCode === 0;

            return {
                isValid: true,
                message: isSuccess ? 'Payment successful' : message,
                data: {
                    orderId,
                    amount,
                    transactionId: transId,
                    resultCode,
                    isSuccess,
                },
            };
        } catch (error: any) {
            console.error('Momo verifyCallback error:', error);
            return {
                isValid: false,
                message: 'Error verifying callback',
            };
        }
    }

    /**
     * Xác thực IPN (Instant Payment Notification) từ Momo
     * IPN được gửi từ Momo server đến server của merchant
     * 
     * @param ipnData - IPN data từ Momo
     * @returns Kết quả xác thực
     */
    verifyIPN(ipnData: MomoCallbackData): {
        isValid: boolean;
        message: string;
        data?: any;
    } {
        const verifyResult = this.verifyCallback(ipnData);

        if (!verifyResult.isValid) {
            return {
                isValid: false,
                message: 'Invalid IPN signature',
            };
        }

        // TODO: Kiểm tra orderId có tồn tại trong database không
        // TODO: Kiểm tra amount có khớp với order không
        // TODO: Kiểm tra order đã được xử lý chưa (tránh duplicate IPN)

        return {
            isValid: true,
            message: 'IPN verified successfully',
            data: verifyResult.data,
        };
    }

    /**
     * Kiểm tra trạng thái giao dịch với Momo
     * Sử dụng khi cần query trạng thái giao dịch
     * 
     * @param orderId - Mã đơn hàng
     * @param requestId - Request ID từ lúc tạo payment
     * @returns Trạng thái giao dịch
     */
    async checkTransactionStatus(orderId: string, requestId: string): Promise<{
        success: boolean;
        message: string;
        resultCode?: number;
        data?: any;
    }> {
        try {
            // Tạo raw signature
            const rawSignature = `accessKey=${momoConfig.accessKey}&orderId=${orderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}`;
            const signature = this.createSignature(rawSignature);

            const requestBody = {
                partnerCode: momoConfig.partnerCode,
                requestId,
                orderId,
                signature,
                lang: momoConfig.lang,
            };

            // Endpoint để query transaction status
            const queryEndpoint = momoConfig.endpoint.replace('/create', '/query');

            const response = await axios.post(queryEndpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            const { resultCode, message } = response.data;

            return {
                success: resultCode === 0,
                message,
                resultCode,
                data: response.data,
            };
        } catch (error: any) {
            console.error('Momo checkTransactionStatus error:', error);
            return {
                success: false,
                message: error.message || 'Error checking transaction status',
            };
        }
    }

    /**
     * Map Momo result code sang message tiếng Việt
     */
    getResultMessage(resultCode: number): string {
        const messages: { [key: number]: string } = {
            0: 'Giao dịch thành công',
            9000: 'Giao dịch đã được xác nhận thành công',
            1000: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán',
            1001: 'Giao dịch thất bại do người dùng từ chối xác nhận thanh toán',
            1002: 'Giao dịch thất bại do giao dịch bị hủy',
            1003: 'Giao dịch thất bại do người dùng hủy giao dịch',
            1004: 'Giao dịch thất bại do số tiền giao dịch vượt quá hạn mức thanh toán của người dùng',
            1005: 'Giao dịch thất bại do URL hoặc QR code đã hết hạn',
            1006: 'Giao dịch thất bại do người dùng từ chối xác nhận thanh toán',
            1007: 'Giao dịch bị từ chối vì tài khoản người dùng bị tạm khóa',
            2001: 'Giao dịch thất bại do sai thông tin',
            3001: 'Giao dịch bị từ chối vì merchant không hợp lệ',
            3002: 'Giao dịch bị từ chối vì số tiền không hợp lệ',
            3003: 'Giao dịch bị từ chối vì thông tin giao dịch không hợp lệ',
            3004: 'Giao dịch bị từ chối vì chữ ký không hợp lệ',
            4001: 'Giao dịch thất bại do không đủ số dư',
            4010: 'Giao dịch thất bại do vượt quá số lần thanh toán trong ngày',
            4011: 'Giao dịch thất bại do vượt quá hạn mức thanh toán',
            4100: 'Giao dịch thất bại do người dùng chưa đăng ký dịch vụ',
            9999: 'Lỗi hệ thống',
        };

        return messages[resultCode] || 'Lỗi không xác định';
    }
}

export default new MomoService();
