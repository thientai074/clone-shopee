import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as orderValidation from '../validations/order.validation';

const router = Router();

/**
 * ==============================================
 * ORDER ROUTES - Các route quản lý đơn hàng
 * ==============================================
 */

// Tất cả routes yêu cầu authentication (user phải đăng nhập)
router.use(authenticate);

/**
 * POST /api/v1/orders
 * Tạo đơn hàng mới
 * 
 * Mục đích:
 * - Tạo order từ giỏ hàng hoặc mua ngay
 * - Lưu thông tin giao hàng và phương thức thanh toán
 * - Kiểm tra tồn kho trước khi tạo order
 * - Nếu thanh toán online, sẽ redirect đến payment gateway
 * 
 * Authentication: Required
 * Request body:
 * - items: Danh sách sản phẩm (productId, quantity, variant)
 * - shippingAddress: Địa chỉ giao hàng (fullName, phone, address, city, district, ward)
 * - paymentMethod: cod | vnpay | momo | bank-card
 * - note: Ghi chú cho đơn hàng (optional)
 */
router.post('/', validate(orderValidation.createOrderSchema), orderController.createOrder);

/**
 * GET /api/v1/orders
 * Lấy danh sách đơn hàng của user
 * 
 * Mục đích:
 * - Hiển thị tất cả đơn hàng của user
 * - Hỗ trợ phân trang
 * - Dùng cho trang "Đơn hàng của tôi"
 * 
 * Authentication: Required
 * Query params:
 * - page: Trang hiện tại (default: 1)
 * - limit: Số items per page (default: 10)
 */
router.get('/', orderController.getOrders);

/**
 * GET /api/v1/orders/seller
 * Lấy danh sách đơn hàng của seller
 * 
 * Mục đích:
 * - Seller xem các đơn hàng có sản phẩm của mình
 * - Quản lý và xử lý đơn hàng
 * - Hỗ trợ phân trang
 * 
 * Authentication: Required
 * Authorization: seller hoặc admin
 * Query params:
 * - page: Trang hiện tại
 * - limit: Số items per page
 */
router.get('/seller', authorize('seller', 'admin'), orderController.getSellerOrders);

/**
 * GET /api/v1/orders/:id
 * Lấy chi tiết một đơn hàng
 * 
 * Mục đích:
 * - Xem thông tin chi tiết đơn hàng
 * - Hiển thị trạng thái, sản phẩm, địa chỉ giao hàng
 * - Tracking đơn hàng
 * 
 * Authentication: Required
 * Params:
 * - id: Order ID
 */
router.get('/:id', orderController.getOrderById);

/**
 * PUT /api/v1/orders/:id/status
 * Cập nhật trạng thái đơn hàng
 * 
 * Mục đích:
 * - Seller/Admin cập nhật trạng thái xử lý đơn hàng
 * - Các trạng thái: pending -> confirmed -> processing -> shipping -> delivered
 * - Gửi notification cho user khi trạng thái thay đổi
 * 
 * Authentication: Required
 * Authorization: seller hoặc admin
 * Params:
 * - id: Order ID
 * Request body:
 * - status: Trạng thái mới (confirmed, processing, shipping, delivered)
 */
router.put('/:id/status', authorize('seller', 'admin'), validate(orderValidation.updateOrderStatusSchema), orderController.updateOrderStatus);

/**
 * POST /api/v1/orders/:id/cancel
 * Hủy đơn hàng
 * 
 * Mục đích:
 * - User hủy đơn hàng chưa xử lý
 * - Hoàn lại số lượng sản phẩm vào kho
 * - Xử lý hoàn tiền nếu đã thanh toán
 * 
 * Authentication: Required
 * Params:
 * - id: Order ID
 * Request body:
 * - reason: Lý do hủy đơn
 */
router.post('/:id/cancel', validate(orderValidation.cancelOrderSchema), orderController.cancelOrder);

export default router;

