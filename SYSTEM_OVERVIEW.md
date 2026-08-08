# Tổng Quan Hệ Thống: Food AI App

Tài liệu này giới thiệu tổng quan về cấu trúc và các chức năng hiện có của dự án Food AI App.

## 1. Kiến Trúc Hệ Thống (Architecture)

Hệ thống được thiết kế theo mô hình Client-Server:
- **Frontend (Client):** Ứng dụng di động (Mobile App) được phát triển bằng **React Native / Expo**. Hệ thống sử dụng file-based routing của Expo Router.
- **Backend (Server):** Máy chủ API được phát triển bằng **Python (FastAPI)**, giao tiếp với cơ sở dữ liệu và cung cấp các dịch vụ RESTful API. Hệ thống có hỗ trợ chạy bằng **Docker**.

---

## 2. Các Chức Năng Chính (Features)

Dựa trên cấu trúc mã nguồn hiện tại, hệ thống cung cấp các nhóm chức năng chính sau:

### 2.1. Quản Lý Người Dùng & Xác Thực (User & Authentication)
- **Đăng nhập / Đăng ký:** Cho phép người dùng tạo tài khoản và đăng nhập vào ứng dụng.
- **Hồ sơ cá nhân (Profile):** Quản lý thông tin cá nhân, xem trang cá nhân của mình và của người dùng khác.

### 2.2. Khám Phá & Quản Lý Công Thức Nấu Ăn (Recipes)
- **Danh sách & Khám phá (Explore):** Duyệt qua các công thức nấu ăn mới và phổ biến ở trang chủ.
- **Chi tiết công thức:** Xem chi tiết nguyên liệu, các bước thực hiện của một món ăn.
- **Tìm kiếm (Search):** Tìm kiếm món ăn, công thức nấu ăn theo từ khóa, thẻ (tags) (hiện tại đang phát triển thêm `searchV2`).

### 2.3. Sổ Tay & Bộ Sưu Tập (Notebook & Collections)
- **Lưu trữ công thức:** Người dùng có thể lưu các công thức yêu thích vào "Sổ tay" (Notebook).
- **Bộ sưu tập (Collections):** Tạo và quản lý các bộ sưu tập công thức nấu ăn cá nhân hóa theo chủ đề.

### 2.4. Tính Năng Video Ngắn (Play / Reels)
- Tương tự như TikTok/Instagram Reels nhưng dành riêng cho ẩm thực.
- Vuốt để xem các video hướng dẫn nấu ăn ngắn, đánh giá món ăn.

### 2.5. Tương Tác Cộng Đồng (Community Interaction)
- Các chức năng tương tác xã hội xung quanh công thức và video (như thả tim, bình luận, chia sẻ, theo dõi).

### 2.6. Trợ Lý AI (AI Features)
- Tích hợp các tính năng trí tuệ nhân tạo (AI) giúp tối ưu trải nghiệm (ví dụ: gợi ý món ăn, phân tích công thức, hoặc trợ lý giải đáp thắc mắc về nấu ăn).

---

## 3. Cấu Trúc Mã Nguồn (Directory Structure)

### Backend (`/backend`)
- **`app/routes/`**: Chứa các endpoint API chia theo module:
  - `ai_route.py`
  - `auth_route.py`
  - `user_route.py`
  - `recipe_route.py`
  - `collection_route.py`
  - `reel_route.py`
  - `community_interaction_route.py`
  - `search_route.py`
  - `tag_route.py`
- **`app/models/` & `app/schemas/`**: Định nghĩa cấu trúc cơ sở dữ liệu và validate dữ liệu (Pydantic/SQLAlchemy).
- **`app/crud/`**: Các thao tác tương tác trực tiếp với cơ sở dữ liệu.
- Cấu hình chạy và quản lý qua Docker (`docker-compose.yml`, `Dockerfile`), các file phục vụ việc chạy migration dữ liệu.

### Frontend (`/frontend`)
- **`app/`**: Chứa các màn hình (screens) của ứng dụng di động:
  - **`(tabs)`**: Chứa các màn hình điều hướng chính dưới thanh tab: `index` (Home), `play` (Reels), `notebook` (Collections), `profile`.
  - Các thư mục khác như `recipe`, `explore-detail`, `user` phục vụ cho điều hướng chi tiết.
- **`components/`**: Các thành phần UI có thể tái sử dụng.
- **`services/`**: Các hàm gọi API lên phía backend.

---

Tài liệu này phản ánh cấu trúc hiện tại của dự án tính đến thời điểm viết. Hệ thống đang trong quá trình hoàn thiện và sẽ tiếp tục được mở rộng trong tương lai.
