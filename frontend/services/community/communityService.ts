import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';
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

const API_BASE_URL = getApiBaseUrl();

export const postRecipeComment = async (recipeId: number, content: string, parentCommentId?: number): Promise<CommentInfo | null> => {
  try {
    const json = await apiClient.post(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
      content,
      parent_comment_id: parentCommentId || null
    });
    return json.data;
  } catch (error) {
    console.error("❌ Lỗi khi đăng bình luận:", error);
    return null;
  }
};

export const postRecipeRating = async (recipeId: number, score: number, comment?: string): Promise<boolean> => {
  try {
    await apiClient.post(`${API_BASE_URL}/recipes/${recipeId}/rate`, {
      score,
      comment: comment || null
    });
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi đăng đánh giá:", error);
    return false;
  }
};

// Hàm theo dõi người dùng
export const followUser = async (userId: number) => {
    try {
        const resData = await apiClient.post(`${API_BASE_URL}/users/${userId}/follow`);
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi followUser:", error);
        throw error;
    }
};

// Hàm hủy theo dõi người dùng
export const unfollowUser = async (userId: number) => {
    try {
        const resData = await apiClient.delete(`${API_BASE_URL}/users/${userId}/follow`);
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi unfollowUser:", error);
        throw error;
    }
};

// Hàm yêu thích (tym) công thức
export const favoriteRecipe = async (recipeId: number) => {
    try {
        const resData = await apiClient.post(`${API_BASE_URL}/recipes/${recipeId}/favorite`);
        return resData.data; // Trả về { isFavorited: boolean }
    } catch (error) {
        console.error("❌ Lỗi favoriteRecipe:", error);
        throw error;
    }
};

// Hàm bỏ yêu thích (bỏ tym) công thức
export const unfavoriteRecipe = async (recipeId: number) => {
    try {
        const resData = await apiClient.delete(`${API_BASE_URL}/recipes/${recipeId}/favorite`);
        return resData.data; // Trả về { isFavorited: boolean }
    } catch (error) {
        console.error("❌ Lỗi unfavoriteRecipe:", error);
        throw error;
    }
};

export interface FollowListItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  is_following: boolean;
  is_self: boolean;
}

export interface FollowListResponse {
  items: FollowListItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    limit: number;
  };
}

const EMPTY_FOLLOW_LIST: FollowListResponse = {
  items: [],
  pagination: { current_page: 1, total_pages: 0, total_items: 0, limit: 20 },
};

const fetchFollowList = async (
  userId: string,
  kind: 'followers' | 'following',
  page: number,
  limit: number
): Promise<FollowListResponse> => {
  try {
    const json = await apiClient.get(`${API_BASE_URL}/users/${userId}/${kind}?page=${page}&limit=${limit}`);
    return json.data || EMPTY_FOLLOW_LIST;
  } catch (error) {
    console.error(`❌ Lỗi lấy danh sách ${kind}:`, error);
    return EMPTY_FOLLOW_LIST;
  }
};

// Danh sách người đang follow tài khoản userId
export const fetchUserFollowers = (userId: string, page: number = 1, limit: number = 20): Promise<FollowListResponse> =>
  fetchFollowList(userId, 'followers', page, limit);

// Danh sách người mà userId đang follow
export const fetchUserFollowing = (userId: string, page: number = 1, limit: number = 20): Promise<FollowListResponse> =>
  fetchFollowList(userId, 'following', page, limit);
