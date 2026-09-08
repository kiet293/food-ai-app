# Food AI App

## Giới thiệu (Introduction)
**Food AI App** là một ứng dụng di động thông minh dành cho những người yêu thích ẩm thực. Ứng dụng hỗ trợ người dùng khám phá, lưu trữ, và chia sẻ các công thức nấu ăn. Với sự hỗ trợ của Trí tuệ Nhân tạo (AI), ứng dụng mang đến trải nghiệm nấu nướng cá nhân hóa và tiện lợi hơn.

## Kiến Trúc Hệ Thống (Architecture)
Dự án được thiết kế theo mô hình Client-Server:
- **Frontend (Mobile App)**: Phát triển bằng **React Native / Expo**, sử dụng file-based routing của Expo Router.
- **Backend (API Server)**: Phát triển bằng **Python (FastAPI)**, cung cấp RESTful API, giao tiếp với cơ sở dữ liệu. Hỗ trợ triển khai dễ dàng bằng **Docker**.

## Tính Năng Chính (Features)

*   **Quản Lý Người Dùng**: Đăng ký, đăng nhập, và quản lý hồ sơ cá nhân (Profile).
*   **Khám Phá Công Thức (Recipes)**: Duyệt công thức mới, xem chi tiết nguyên liệu/các bước nấu, tìm kiếm thông minh theo từ khóa hoặc thẻ (tags).
*   **Sổ Tay & Bộ Sưu Tập (Notebook & Collections)**: Lưu các công thức yêu thích và tự tạo bộ sưu tập cá nhân theo chủ đề.
*   **Video Ngắn (Play/Reels)**: Xem, vuốt các video hướng dẫn nấu ăn, review đồ ăn định dạng ngắn (tương tự TikTok/Reels).
*   **Tương Tác Cộng Đồng (Community)**: Thả tim, bình luận, chia sẻ, và theo dõi người dùng khác.
*   **Trợ Lý AI**: Các tính năng AI thông minh như gợi ý món ăn, phân tích công thức nấu ăn, và trợ lý ảo giải đáp thắc mắc về nấu nướng.

## Cấu Trúc Dự Án (Directory Structure)

```text
FoodAIApp/
│
├── backend/              # Mã nguồn API Server
│   ├── app/              # Logic ứng dụng, API routes, Models, Schemas, CRUD
│   ├── Dockerfile        # Dockerfile để build image backend
│   └── docker-compose.yml# Cấu hình chạy các services backend bằng Docker
│
└── frontend/             # Mã nguồn Mobile App
    ├── app/              # Các màn hình (screens) của ứng dụng
    ├── components/       # Các UI components tái sử dụng
    └── services/         # Logic gọi API backend
```

## Cài đặt và Khởi chạy (Installation & Setup)

Dưới đây là hướng dẫn cơ bản để chạy dự án ở môi trường phát triển (Development):

### 1. Backend
Di chuyển vào thư mục backend và chạy bằng Docker (khuyến nghị):
```bash
cd backend
# Build và chạy các container
docker-compose up -d --build
```
*Lưu ý: API server thường sẽ chạy ở cổng `8000` (http://localhost:8000).*

### 2. Frontend
Di chuyển vào thư mục frontend, cài đặt thư viện và khởi chạy Expo:
```bash
cd frontend
npm install # hoặc yarn install
npx expo start
```
Sau đó, bạn có thể quét mã QR bằng ứng dụng Expo Go trên điện thoại hoặc chạy trên máy ảo Android/iOS Simulator.
