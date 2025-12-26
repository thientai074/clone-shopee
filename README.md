# Shopee Clone Backend

Backend API cho ứng dụng Shopee Clone được xây dựng với ExpressJS, TypeScript, MongoDB, và Redis.

## 🚀 Tính năng

- ✅ **Authentication & Authorization**: JWT tokens, refresh tokens, email verification, password reset
- ✅ **User Management**: Profile management, address management, role-based access (buyer/seller/admin)
- ✅ **Product Management**: CRUD operations, variants, stock tracking, image uploads
- ✅ **Shopping Cart**: Add/remove items, quantity updates, stock validation
- ✅ **Order Management**: Order creation, status tracking, cancellation, seller orders
- ✅ **Search & Filter**: Full-text search, advanced filtering, pagination
- ✅ **Caching**: Redis caching for improved performance
- ✅ **Security**: Rate limiting, input validation, XSS protection, SQL injection prevention
- ✅ **Optimizations**: Database indexing, query optimization, image optimization

## 📋 Yêu cầu

- Node.js >= 16.x
- MongoDB >= 5.x
- Redis >= 6.x (optional, for caching)

## 🛠️ Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd Clone\ Shoppe
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình environment variables**
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
- MongoDB connection string
- Redis configuration (optional)
- JWT secrets
- Cloudinary credentials (for image uploads)
- Email service configuration

4. **Tạo thư mục uploads**
```bash
mkdir uploads
mkdir logs
```

## 🚀 Chạy ứng dụng

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

## 📚 API Documentation

API được phân chia thành các module sau:

### Authentication (`/api/v1/auth`)
- `POST /register` - Đăng ký tài khoản
- `POST /login` - Đăng nhập
- `POST /refresh-token` - Làm mới access token
- `POST /logout` - Đăng xuất
- `POST /verify-email` - Xác thực email
- `POST /request-password-reset` - Yêu cầu reset mật khẩu
- `POST /reset-password` - Reset mật khẩu
- `GET /me` - Lấy thông tin user hiện tại

### Users (`/api/v1/users`)
- `GET /profile` - Lấy thông tin profile
- `PUT /profile` - Cập nhật profile
- `POST /avatar` - Upload avatar
- `POST /addresses` - Thêm địa chỉ
- `PUT /addresses/:addressId` - Cập nhật địa chỉ
- `DELETE /addresses/:addressId` - Xóa địa chỉ

### Products (`/api/v1/products`)
- `GET /` - Lấy danh sách sản phẩm (có filter, search, pagination)
- `GET /:id` - Lấy chi tiết sản phẩm
- `GET /slug/:slug` - Lấy sản phẩm theo slug
- `POST /` - Tạo sản phẩm (seller only)
- `PUT /:id` - Cập nhật sản phẩm (seller only)
- `DELETE /:id` - Xóa sản phẩm (seller only)
- `POST /upload-images` - Upload hình ảnh sản phẩm

### Cart (`/api/v1/cart`)
- `GET /` - Lấy giỏ hàng
- `POST /items` - Thêm sản phẩm vào giỏ
- `PUT /items` - Cập nhật số lượng
- `DELETE /items/:productId` - Xóa sản phẩm khỏi giỏ
- `DELETE /` - Xóa toàn bộ giỏ hàng

### Orders (`/api/v1/orders`)
- `POST /` - Tạo đơn hàng
- `GET /` - Lấy danh sách đơn hàng
- `GET /seller` - Lấy đơn hàng của seller
- `GET /:id` - Lấy chi tiết đơn hàng
- `PUT /:id/status` - Cập nhật trạng thái đơn (seller only)
- `POST /:id/cancel` - Hủy đơn hàng

## 🔧 Code Optimizations

### Database Indexing
- Text indexes cho product search
- Compound indexes cho các query phổ biến
- Unique indexes cho email, slug, order number

### Caching Strategy
- Redis caching cho product listings
- Cache invalidation khi có update
- Configurable TTL cho các loại data khác nhau

### Query Optimization
- Lean queries cho read operations
- Select only needed fields
- Populate only necessary relations
- Pagination để giảm load

### Security
- Rate limiting cho API endpoints
- Input validation với Joi
- MongoDB sanitization
- Helmet security headers
- HPP protection

## 📁 Cấu trúc thư mục

```
src/
├── config/          # Database, Redis, Cloudinary config
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
├── validations/     # Joi validation schemas
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 🧪 Testing

```bash
npm test
```

## 📝 License

MIT
