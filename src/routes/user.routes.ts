import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * ==============================================
 * USER ROUTES - Các route quản lý thông tin người dùng
 * ==============================================
 */

// Tất cả routes yêu cầu authentication (user phải đăng nhập)
router.use(authenticate);

/**
 * GET /api/v1/users/profile
 * Lấy thông tin profile của user
 * 
 * Mục đích:
 * - Hiển thị thông tin cá nhân
 * - Lấy danh sách địa chỉ đã lưu
 * - Xem avatar, email, phone, etc.
 * 
 * Authentication: Required
 * Response: Thông tin user đầy đủ (không bao gồm password)
 */
router.get('/profile', userController.getProfile);

/**
 * PUT /api/v1/users/profile
 * Cập nhật thông tin profile
 * 
 * Mục đích:
 * - Chỉnh sửa tên, số điện thoại
 * - Cập nhật thông tin cá nhân
 * - Không thể đổi email (cần verify lại)
 * 
 * Authentication: Required
 * Request body:
 * - name: Tên mới (optional)
 * - phone: Số điện thoại mới (optional)
 * - bio: Giới thiệu bản thân (optional)
 */
router.put('/profile', userController.updateProfile);

/**
 * POST /api/v1/users/avatar
 * Upload avatar mới
 * 
 * Mục đích:
 * - Upload ảnh đại diện lên Cloudinary
 * - Tự động resize và optimize
 * - Xóa avatar cũ (nếu có)
 * - Cập nhật URL avatar trong database
 * 
 * Authentication: Required
 * Rate Limit: Có (uploadLimiter) - Ngăn spam upload
 * Request: multipart/form-data
 * - file: File ảnh (jpg, png, webp)
 * - Max size: 5MB
 */
router.post('/avatar', uploadLimiter, uploadSingle, userController.uploadAvatar);

/**
 * POST /api/v1/users/addresses
 * Thêm địa chỉ giao hàng mới
 * 
 * Mục đích:
 * - Lưu địa chỉ để dùng khi đặt hàng
 * - Hỗ trợ nhiều địa chỉ (nhà, công ty, etc.)
 * - Set địa chỉ mặc định
 * 
 * Authentication: Required
 * Request body:
 * - fullName: Tên người nhận
 * - phone: Số điện thoại
 * - address: Địa chỉ chi tiết
 * - city: Thành phố
 * - district: Quận/Huyện
 * - ward: Phường/Xã
 * - isDefault: Đặt làm địa chỉ mặc định (optional)
 */
router.post('/addresses', userController.addAddress);

/**
 * PUT /api/v1/users/addresses/:addressId
 * Cập nhật địa chỉ đã lưu
 * 
 * Mục đích:
 * - Chỉnh sửa thông tin địa chỉ
 * - Thay đổi địa chỉ mặc định
 * - Cập nhật tên người nhận, SĐT
 * 
 * Authentication: Required
 * Params:
 * - addressId: ID của địa chỉ cần cập nhật
 * Request body: Các field muốn cập nhật
 */
router.put('/addresses/:addressId', userController.updateAddress);

/**
 * DELETE /api/v1/users/addresses/:addressId
 * Xóa địa chỉ đã lưu
 * 
 * Mục đích:
 * - Xóa địa chỉ không dùng nữa
 * - Không thể xóa nếu đang có order sử dụng
 * 
 * Authentication: Required
 * Params:
 * - addressId: ID của địa chỉ cần xóa
 */
router.delete('/addresses/:addressId', userController.deleteAddress);

export default router;

