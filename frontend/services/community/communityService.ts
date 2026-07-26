import { getApiBaseUrl } from '../shared/apiConfig';
import { getToken } from '../auth/authService';
import { AuthorInfo } from '../shared/types';

export interface CommentInfo {
  id: number;
  content: string;
  created_at: string;
  user: AuthorInfo | null;
  is_author?: boolean;
  replies?: CommentInfo[];
  parent_comment_id?: number;
}

export const postRecipeComment = async (recipeId: number, content: string, parentCommentId?: number): Promise<CommentInfo | null> => {
  try {
    const token = await getToken();
    const API_BASE_URL = getApiBaseUrl();

    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        parent_comment_id: parentCommentId || null
      })
    });

    if (!response.ok) {
      throw new Error('Failed to post comment');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("❌ Lỗi khi đăng bình luận:", error);
    return null;
  }
};

export const postRecipeRating = async (recipeId: number, score: number, comment?: string): Promise<boolean> => {
  try {
    const token = await getToken();
    const API_BASE_URL = getApiBaseUrl();

    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        score,
        comment: comment || null
      })
    });

    if (!response.ok) {
      throw new Error('Failed to post rating');
    }

    return true;
  } catch (error) {
    console.error("❌ Lỗi khi đăng đánh giá:", error);
    return false;
  }
};

// Hàm theo dõi người dùng
export const followUser = async (userId: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện");
        const API_BASE_URL = getApiBaseUrl();

        const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Lỗi khi theo dõi người dùng");
        }

        const resData = await response.json();
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi followUser:", error);
        throw error;
    }
};

// Hàm hủy theo dõi người dùng
export const unfollowUser = async (userId: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện");
        const API_BASE_URL = getApiBaseUrl();

        const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Lỗi khi hủy theo dõi người dùng");
        }

        const resData = await response.json();
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi unfollowUser:", error);
        throw error;
    }
};
