// Kiểu dữ liệu dùng chung giữa nhiều module (recipe, community, ...)
export interface AuthorInfo {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  is_following?: boolean;
  is_self?: boolean;
}


export interface CommentInfo {
  id: number;
  content: string;
  created_at: string;
  user: AuthorInfo | null;
  is_author?: boolean;
  replies?: CommentInfo[];
  parent_comment_id?: number;
}
