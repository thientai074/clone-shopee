import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as paymentValidation from '../validations/payment.validation';

const router = Router();

/**
 * ==============================================
 * PAYMENT ROUTES - Các route xử lý thanh toán
 * ==============================================
 */

/**
 * POST /api/v1/payment/initiate
 * Khởi tạo thanh toán cho một order
 * 
 * Mục đích:
 * - Tạo payment record trong database
 * - Generate payment URL từ VNPay hoặc Momo
 * - Trả về URL để redirect user đến trang thanh toán
 * 
 * Authentication: Required (user phải đăng nhập)
 * Request body:
 * - orderId: ID của order cần thanh toán
 * - paymentMethod: vnpay | momo | bank-card
 * - bankCode: (optional) Mã ngân hàng cho VNPay
 */
router.post(
    '/initiate',
    authenticate,
    validate(paymentValidation.initiatePaymentSchema),
    paymentController.initiatePayment
);

/**
 * GET /api/v1/payment/vnpay/callback
 * Callback từ VNPay sau khi user thanh toán
 * 
 * Mục đích:
 * - Nhận kết quả thanh toán từ VNPay
 * - Xác thực chữ ký (signature) để đảm bảo dữ liệu hợp lệ
 * - Cập nhật trạng thái payment và order trong database
 * - Redirect user về frontend với kết quả
 * 
 * Authentication: Not required (VNPay redirect)
 * Query params: Các tham số từ VNPay (vnp_*)
 */
router.get('/vnpay/callback', paymentController.vnpayCallback);

/**
 * GET /api/v1/payment/vnpay/ipn
 * IPN (Instant Payment Notification) từ VNPay
 * 
 * Mục đích:
 * - Nhận notification từ VNPay server (server-to-server)
 * - Xác thực và cập nhật trạng thái giao dịch
 * - Đảm bảo payment được confirm ngay cả khi user đóng browser
 * 
 * Authentication: Not required (VNPay server call)
 * Query params: Các tham số từ VNPay
 * Response: JSON với RspCode cho VNPay
 */
router.get('/vnpay/ipn', paymentController.vnpayIPN);

/**
 * POST /api/v1/payment/momo/callback
 * Callback từ Momo sau khi user thanh toán
 * 
 * Mục đích:
 * - Nhận kết quả thanh toán từ Momo
 * - Xác thực signature
 * - Cập nhật trạng thái payment và order
 * - Redirect user về frontend
 * 
 * Authentication: Not required (Momo redirect)
 * Request body: Dữ liệu từ Momo
 */
router.post('/momo/callback', paymentController.momoCallback);

/**
 * POST /api/v1/payment/momo/ipn
 * IPN từ Momo
 * 
 * Mục đích:
 * - Nhận IPN từ Momo server
 * - Xác thực và cập nhật trạng thái
 * - Confirm giao dịch
 * 
 * Authentication: Not required (Momo server call)
 * Request body: IPN data từ Momo
 * Response: JSON với resultCode cho Momo
 */
router.post('/momo/ipn', paymentController.momoIPN);

/**
 * GET /api/v1/payment/status/:orderId
 * Lấy trạng thái thanh toán của một order
 * 
 * Mục đích:
 * - Kiểm tra trạng thái thanh toán hiện tại
 * - Xem thông tin chi tiết payment (transaction ID, gateway, etc.)
 * - Dùng để polling status từ frontend
 * 
 * Authentication: Required
 * Params:
 * - orderId: ID của order
 */
router.get('/status/:orderId', authenticate, paymentController.getPaymentStatus);

/**
 * GET /api/v1/payment/history
 * Lấy lịch sử thanh toán của user
 * 
 * Mục đích:
 * - Xem tất cả các giao dịch thanh toán đã thực hiện
 * - Hỗ trợ phân trang
 * - Dùng cho trang "Lịch sử giao dịch" trong profile
 * 
 * Authentication: Required
 * Query params:
 * - page: Trang hiện tại (default: 1)
 * - limit: Số items per page (default: 10)
 */
router.get('/history', authenticate, paymentController.getPaymentHistory);

/**
 * POST /api/v1/payment/cancel/:orderId
 * Hủy payment đang pending
 * 
 * Mục đích:
 * - Hủy payment chưa hoàn thành
 * - Cập nhật trạng thái thành 'cancelled'
 * - Không thể hủy payment đã thành công
 * 
 * Authentication: Required
 * Params:
 * - orderId: ID của order
 */
router.post('/cancel/:orderId', authenticate, paymentController.cancelPayment);

export default router;
