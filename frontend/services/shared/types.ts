// Kiểu dữ liệu dùng chung giữa nhiều module (recipe, community, ...)
export interface AuthorInfo {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  is_following?: boolean;
  is_self?: boolean;
}
