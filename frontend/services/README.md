# Cấu trúc `services/` theo module

Toàn bộ service gọi API đã được tổ chức lại theo đúng 8 module nghiệp vụ mô tả trong
[`backend/db/module`](../../backend/db/module), thay vì để chung 9 file rời rạc ở gốc
thư mục như trước. Mục tiêu: mỗi file service chỉ nói về **một** module nghiệp vụ, dễ
tìm, dễ mở rộng, không còn trùng tên hàm giữa các file.

## Cấu trúc mới

```
services/
  shared/
    apiConfig.ts       getApiBaseUrl() — 1 nơi duy nhất tự dò IP máy + build base URL API
    types.ts           Kiểu dùng chung nhiều module (AuthorInfo, ...)
  auth/authService.ts        Module 1 — đăng ký/đăng nhập/đăng xuất/token, sửa profile bản thân
  user/userService.ts         Module 1 — xem profile công khai người khác, danh sách popular chefs
  recipe/recipeService.ts      Module 2 — CRUD công thức, explore feed/grid, trending, sổ tay đã lưu
  ai/aiService.ts               Module 3 — AI nhận diện nguyên liệu, chat đổi món, tìm theo nguyên liệu
  community/communityService.ts Module 4 — bình luận, đánh giá, follow/unfollow người dùng
  reel/reelService.ts            Reels — CRUD reel, like, bình luận reel (không còn lẫn follow)
  search/searchService.ts        Module 6 — tìm kiếm công thức cộng đồng
  tag/tagService.ts               Module 6 — hot tags
  mock/mockCommunityData.ts       Dữ liệu mẫu dùng cho UI chưa có API thật (Collections demo, hot tags demo...)
```

## Đã thay đổi những gì

- **Gộp logic dò IP/base URL bị lặp lại ở 5 file** (`exploreService`, `aiService`,
  `reelService`, `authService`, `searchService`) thành một hàm dùng chung
  `shared/apiConfig.ts#getApiBaseUrl()`.
- **Tách các hàm bị trộn module trong cùng 1 file:**
  - `exploreService.ts` cũ (300+ dòng, lẫn recipe + comment/rating + popular chefs) →
    chia thành `recipe/recipeService.ts` (recipe/explore), `community/communityService.ts`
    (comment, rating) và bổ sung `fetchPopularChefs`/`ChefInfo` vào `user/userService.ts`.
  - `aiService.ts` cũ (lẫn AI detect + CRUD công thức trong DB) → giữ lại phần AI thuần
    (`analyzeImagesWithAI`, `requestNewRecipe`, `searchRecipes`) trong `ai/aiService.ts`,
    chuyển phần CRUD sổ tay công thức (`saveRecipeToDatabase`, `getSavedRecipes`,
    `deleteRecipe`, `getPopularRecipes`) sang `recipe/recipeService.ts`.
  - `reelService.ts` cũ (lẫn reels + follow người dùng) → bỏ `followUser`/`unfollowUser`
    ra khỏi reel, chuyển sang `community/communityService.ts` (đúng bản chất "theo dõi"
    là tương tác cộng đồng, không phải riêng của reels).
- **Xoá file chết:** `storageService.ts` (lưu công thức bằng AsyncStorage cục bộ) không
  còn nơi nào import — đây là code sót lại từ bản demo trước khi có backend thật, đã xoá
  hẳn thay vì mang theo sang cấu trúc mới.
- **Cập nhật toàn bộ ~19 vị trí import** trong `app/**` và `components/**` trỏ sang
  đường dẫn module mới (một số nơi trước import chung 1 dòng từ `exploreService`/`aiService`/
  `reelService` nay phải tách thành 2 dòng import vì hàm nằm ở 2 module khác nhau).

## Không đổi

- Tên hàm/interface export giữ nguyên (`fetchUserProfile`, `followUser`, `AIAnalysisResult`,
  `TrendingRecipeItem`, ...) — chỉ đổi *đường dẫn file*, không đổi *API của service* — nên
  không có rủi ro về mặt hành vi, chỉ là dọn lại vị trí.
- Đã chạy `npx tsc --noEmit` sau khi hoàn tất — không còn lỗi biên dịch, không còn import
  nào trỏ về đường dẫn cũ (đã kiểm bằng grep toàn repo).

## Khi thêm service mới

Đặt vào đúng thư mục module tương ứng ở trên. Nếu một chức năng thuộc nhiều module (vd.
vừa liên quan recipe vừa liên quan community), ưu tiên đặt hàm gọi API ở module mà nó
*thay đổi dữ liệu* (write), còn kiểu dữ liệu dùng chung thì đặt ở `shared/types.ts` để
tránh phụ thuộc vòng giữa các module.
