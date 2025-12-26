import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * ==============================================
 * CART ROUTES - Các route quản lý giỏ hàng
 * ==============================================
 */

// Tất cả routes yêu cầu authentication (user phải đăng nhập)
router.use(authenticate);

/**
 * GET /api/v1/cart
 * Lấy thông tin giỏ hàng của user
 * 
 * Mục đích:
 * - Hiển thị tất cả sản phẩm trong giỏ hàng
 * - Tính tổng tiền tạm tính
 * - Dùng cho trang giỏ hàng
 * 
 * Authentication: Required
 * Response: Thông tin giỏ hàng với danh sách items
 */
router.get('/', cartController.getCart);

/**
 * POST /api/v1/cart/items
 * Thêm sản phẩm vào giỏ hàng
 * 
 * Mục đích:
 * - Thêm sản phẩm mới vào giỏ hàng
 * - Nếu sản phẩm đã có, tăng số lượng
 * - Kiểm tra tồn kho trước khi thêm
 * 
 * Authentication: Required
 * Request body:
 * - productId: ID của sản phẩm
 * - quantity: Số lượng cần thêm
 * - variant: Biến thể sản phẩm (nếu có)
 */
router.post('/items', cartController.addToCart);

/**
 * PUT /api/v1/cart/items
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * 
 * Mục đích:
 * - Thay đổi số lượng sản phẩm đã có trong giỏ
 * - Kiểm tra tồn kho khi tăng số lượng
 * - Xóa item nếu quantity = 0
 * 
 * Authentication: Required
 * Request body:
 * - productId: ID của sản phẩm
 * - quantity: Số lượng mới
 */
router.put('/items', cartController.updateCartItem);

/**
 * DELETE /api/v1/cart/items/:productId
 * Xóa một sản phẩm khỏi giỏ hàng
 * 
 * Mục đích:
 * - Xóa sản phẩm cụ thể khỏi giỏ hàng
 * - Dùng khi user click nút "Xóa" trên từng item
 * 
 * Authentication: Required
 * Params:
 * - productId: ID của sản phẩm cần xóa
 */
router.delete('/items/:productId', cartController.removeFromCart);

/**
 * DELETE /api/v1/cart
 * Xóa toàn bộ giỏ hàng
 * 
 * Mục đích:
 * - Xóa tất cả sản phẩm trong giỏ hàng
 * - Dùng sau khi đặt hàng thành công
 * - Hoặc khi user muốn làm mới giỏ hàng
 * 
 * Authentication: Required
 */
router.delete('/', cartController.clearCart);

export default router;

