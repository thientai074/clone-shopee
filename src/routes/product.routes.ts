import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { cache, clearCache } from '../middleware/cache.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';
import * as productValidation from '../validations/product.validation';

const router = Router();

/**
 * ==============================================
 * PRODUCT ROUTES - Các route quản lý sản phẩm
 * ==============================================
 */

/**
 * ============================================
 * PUBLIC ROUTES - Không cần authentication
 * ============================================
 */

/**
 * GET /api/v1/products
 * Lấy danh sách sản phẩm với filter và pagination
 * 
 * Mục đích:
 * - Hiển thị danh sách sản phẩm trên trang chủ
 * - Hỗ trợ tìm kiếm, filter, sort
 * - Phân trang để tối ưu performance
 * - Cache 5 phút để giảm tải database
 * 
 * Query params:
 * - page: Trang hiện tại (default: 1)
 * - limit: Số items per page (default: 20)
 * - search: Tìm kiếm theo tên sản phẩm
 * - category: Filter theo category ID
 * - minPrice, maxPrice: Filter theo khoảng giá
 * - sort: Sắp xếp (price, -price, createdAt, -createdAt, sold)
 * 
 * Cache: 300 seconds (5 phút)
 */
router.get('/', validate(productValidation.getProductsSchema), cache(300), productController.getProducts);

/**
 * GET /api/v1/products/slug/:slug
 * Lấy chi tiết sản phẩm theo slug (SEO friendly)
 * 
 * Mục đích:
 * - Hiển thị trang chi tiết sản phẩm
 * - URL thân thiện với SEO (vd: /products/iphone-15-pro-max)
 * - Tăng view count
 * - Cache lâu hơn (10 phút) vì ít thay đổi
 * 
 * Params:
 * - slug: URL slug của sản phẩm (vd: iphone-15-pro-max)
 * 
 * Cache: 600 seconds (10 phút)
 */
router.get('/slug/:slug', cache(600), productController.getProductBySlug);

/**
 * GET /api/v1/products/:id
 * Lấy chi tiết sản phẩm theo ID
 * 
 * Mục đích:
 * - Lấy thông tin sản phẩm bằng ID
 * - Dùng cho API calls từ mobile app
 * - Populate seller info và reviews
 * 
 * Params:
 * - id: Product ID
 * 
 * Cache: 600 seconds (10 phút)
 */
router.get('/:id', cache(600), productController.getProductById);

/**
 * ============================================
 * SELLER ROUTES - Yêu cầu role seller/admin
 * ============================================
 */

/**
 * POST /api/v1/products
 * Tạo sản phẩm mới
 * 
 * Mục đích:
 * - Seller tạo sản phẩm để bán
 * - Tự động generate slug từ tên
 * - Set seller ID từ user đang đăng nhập
 * - Clear cache sau khi tạo
 * 
 * Authentication: Required
 * Authorization: seller hoặc admin
 * Request body:
 * - name: Tên sản phẩm
 * - description: Mô tả chi tiết
 * - price: Giá bán
 * - category: Category ID
 * - stock: Số lượng tồn kho
 * - images: Mảng URL ảnh sản phẩm
 * - variants: Biến thể (size, color, etc.) - optional
 * 
 * Middleware:
 * - clearCache: Xóa cache của /api/v1/products* để cập nhật danh sách
 */
router.post(
    '/',
    authenticate,
    authorize('seller', 'admin'),
    validate(productValidation.createProductSchema),
    clearCache('/api/v1/products*'),
    productController.createProduct
);

/**
 * PUT /api/v1/products/:id
 * Cập nhật thông tin sản phẩm
 * 
 * Mục đích:
 * - Seller chỉnh sửa sản phẩm của mình
 * - Cập nhật giá, tồn kho, mô tả
 * - Không thể sửa sản phẩm của seller khác
 * - Clear cache sau khi cập nhật
 * 
 * Authentication: Required
 * Authorization: seller hoặc admin
 * Params:
 * - id: Product ID
 * Request body: Các field muốn cập nhật
 * 
 * Middleware:
 * - clearCache: Xóa cache để hiển thị thông tin mới
 */
router.put(
    '/:id',
    authenticate,
    authorize('seller', 'admin'),
    validate(productValidation.updateProductSchema),
    clearCache('/api/v1/products*'),
    productController.updateProduct
);

/**
 * DELETE /api/v1/products/:id
 * Xóa sản phẩm
 * 
 * Mục đích:
 * - Seller xóa sản phẩm không bán nữa
 * - Soft delete (đánh dấu isDeleted = true)
 * - Không xóa vật lý để giữ lịch sử order
 * - Clear cache sau khi xóa
 * 
 * Authentication: Required
 * Authorization: seller hoặc admin
 * Params:
 * - id: Product ID
 * 
 * Middleware:
 * - clearCache: Xóa cache để cập nhật danh sách
 */
router.delete(
    '/:id',
    authenticate,
    authorize('seller', 'admin'),
    clearCache('/api/v1/products*'),
    productController.deleteProduct
);

/**
 * POST /api/v1/products/upload-images
 * Upload ảnh sản phẩm lên Cloudinary
 * 
 * Mục đích:
 * - Upload nhiều ảnh cùng lúc (max 5 ảnh)
 * - Tự động resize và optimize
 * - Trả về mảng URL để lưu vào product
 * - Dùng trước khi tạo/cập nhật sản phẩm
 * 
 * Authentication: Required
 * Authorization: seller hoặc admin
 * Rate Limit: Có (uploadLimiter) - Ngăn spam upload
 * Request: multipart/form-data
 * - files: Mảng file ảnh (max 5 files)
 * - Max size mỗi file: 5MB
 * - Allowed types: jpg, png, webp
 * 
 * Response:
 * - imageUrls: Mảng URL ảnh đã upload
 */
router.post(
    '/upload-images',
    authenticate,
    authorize('seller', 'admin'),
    uploadLimiter,
    uploadMultiple,
    productController.uploadProductImages
);

export default router;

