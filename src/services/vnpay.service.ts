import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';
import { vnpayConfig } from '../config/payment.config';

/**
 * VNPay Service
 * Xử lý tích hợp với cổng thanh toán VNPay
 * 
 * VNPay flow:
 * 1. Tạo URL thanh toán với các tham số và chữ ký
 * 2. Redirect user đến VNPay
 * 3. User thực hiện thanh toán trên VNPay
 * 4. VNPay redirect về returnUrl với kết quả
 * 5. VNPay gửi IPN (Instant Payment Notification) để confirm
 */

interface VNPayPaymentParams {
    orderId: string;
    amount: number;
    orderInfo: string;
    ipAddr: string;
    bankCode?: string;
}

interface VNPayReturnData {
    vnp_TmnCode: string;
    vnp_Amount: string;
    vnp_BankCode: string;
    vnp_BankTranNo: string;
    vnp_CardType: string;
    vnp_PayDate: string;
    vnp_OrderInfo: string;
    vnp_TransactionNo: string;
    vnp_ResponseCode: string;
    vnp_TransactionStatus: string;
    vnp_TxnRef: string;
    vnp_SecureHashType: string;
    vnp_SecureHash: string;
    [key: string]: string;
}

class VNPayService {
    /**
     * Sắp xếp object theo thứ tự alphabet của key
     * VNPay yêu cầu params phải được sắp xếp trước khi tạo hash
     */
    private sortObject(obj: any): any {
        const sorted: any = {};
        const keys = Object.keys(obj).sort();

        keys.forEach(key => {
            sorted[key] = obj[key];
        });

        return sorted;
    }

    /**
     * Tạo chữ ký (signature) cho request
     * Sử dụng HMAC SHA512 với secret key
     */
    private createSignature(data: any, secretKey: string): string {
        const sortedData = this.sortObject(data);
        const signData = qs.stringify(sortedData, { encode: false });

        const hmac = crypto.createHmac('sha512', secretKey);
        const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        return signature;
    }

    /**
     * Tạo URL thanh toán VNPay
     * 
     * @param orderId - Mã đơn hàng
     * @param amount - Số tiền (VND)
     * @param orderInfo - Thông tin đơn hàng
     * @param ipAddr - IP address của khách hàng
     * @param bankCode - Mã ngân hàng (optional, nếu muốn thanh toán qua ngân hàng cụ thể)
     * @returns URL để redirect user đến VNPay
     */
    createPaymentUrl(params: VNPayPaymentParams): string {
        const { orderId, amount, orderInfo, ipAddr, bankCode } = params;

        // Tạo timestamp cho request
        const createDate = moment().format('YYYYMMDDHHmmss');

        // VNPay yêu cầu amount phải nhân 100 (convert to smallest unit)
        const vnpAmount = amount * 100;

        // Tạo object chứa các tham số
        let vnpParams: any = {
            vnp_Version: vnpayConfig.version,
            vnp_Command: vnpayConfig.command,
            vnp_TmnCode: vnpayConfig.tmnCode,
            vnp_Locale: vnpayConfig.locale,
            vnp_CurrCode: vnpayConfig.currencyCode,
            vnp_TxnRef: orderId, // Mã tham chiếu giao dịch (order ID)
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other', // Loại hàng hóa
            vnp_Amount: vnpAmount.toString(),
            vnp_ReturnUrl: vnpayConfig.returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        // Thêm bank code nếu có
        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode;
        }

        // Sắp xếp params và tạo signature
        vnpParams = this.sortObject(vnpParams);
        const signData = qs.stringify(vnpParams, { encode: false });
        const signature = this.createSignature(vnpParams, vnpayConfig.hashSecret);

        // Tạo URL cuối cùng
        const paymentUrl = `${vnpayConfig.url}?${signData}&vnp_SecureHash=${signature}`;

        return paymentUrl;
    }

    /**
     * Xác thực callback từ VNPay
     * Kiểm tra chữ ký để đảm bảo response từ VNPay là hợp lệ
     * 
     * @param vnpParams - Query parameters từ VNPay return URL
     * @returns Object chứa thông tin xác thực và dữ liệu giao dịch
     */
    verifyReturnUrl(vnpParams: VNPayReturnData): {
        isValid: boolean;
        message: string;
        data?: {
            orderId: string;
            amount: number;
            transactionNo: string;
            bankCode: string;
            cardType: string;
            payDate: string;
            responseCode: string;
            isSuccess: boolean;
        };
    } {
        const secureHash = vnpParams.vnp_SecureHash;

        // Loại bỏ các field không cần thiết cho việc verify
        const verifyParams = { ...vnpParams };
        delete verifyParams.vnp_SecureHash;
        delete verifyParams.vnp_SecureHashType;

        // Tạo signature từ params nhận được
        const calculatedSignature = this.createSignature(verifyParams, vnpayConfig.hashSecret);

        // So sánh signature
        if (secureHash !== calculatedSignature) {
            return {
                isValid: false,
                message: 'Invalid signature - Chữ ký không hợp lệ',
            };
        }

        // Kiểm tra response code
        // 00: Thành công
        // Các mã khác: Thất bại
        const isSuccess = vnpParams.vnp_ResponseCode === '00' && vnpParams.vnp_TransactionStatus === '00';

        return {
            isValid: true,
            message: isSuccess ? 'Payment successful' : 'Payment failed',
            data: {
                orderId: vnpParams.vnp_TxnRef,
                amount: parseInt(vnpParams.vnp_Amount) / 100, // Convert back to VND
                transactionNo: vnpParams.vnp_TransactionNo,
                bankCode: vnpParams.vnp_BankCode,
                cardType: vnpParams.vnp_CardType,
                payDate: vnpParams.vnp_PayDate,
                responseCode: vnpParams.vnp_ResponseCode,
                isSuccess,
            },
        };
    }

    /**
     * Xác thực IPN (Instant Payment Notification) từ VNPay
     * IPN được gửi từ VNPay server đến server của merchant để confirm giao dịch
     * 
     * @param vnpParams - IPN parameters từ VNPay
     * @returns Kết quả xác thực
     */
    verifyIPN(vnpParams: VNPayReturnData): {
        isValid: boolean;
        message: string;
        responseCode: string;
        data?: any;
    } {
        const verifyResult = this.verifyReturnUrl(vnpParams);

        if (!verifyResult.isValid) {
            return {
                isValid: false,
                message: 'Invalid signature',
                responseCode: '97', // Checksum failed
            };
        }

        // TODO: Kiểm tra orderId có tồn tại trong database không
        // TODO: Kiểm tra amount có khớp với order không
        // TODO: Kiểm tra order đã được xử lý chưa (tránh duplicate IPN)

        return {
            isValid: true,
            message: 'IPN verified successfully',
            responseCode: '00', // Success
            data: verifyResult.data,
        };
    }

    /**
     * Map VNPay response code sang message tiếng Việt
     */
    getResponseMessage(responseCode: string): string {
        const messages: { [key: string]: string } = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
            '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
            '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
            '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
            '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
            '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
            '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
            '75': 'Ngân hàng thanh toán đang bảo trì',
            '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
            '99': 'Các lỗi khác',
        };

        return messages[responseCode] || 'Lỗi không xác định';
    }
}

export default new VNPayService();
