import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

export interface UserProfileInfo {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  made_count: number;
  want_to_make_count: number;
  following_count: number;
  follower_count: number;
  total_likes_count: number;
  is_following: boolean;
  is_self: boolean;
  recent_recipes: {
    id: string;
    title: string;
    image: string;
  }[];
  collections: {
    id: string;
    title: string;
    count: number;
    image: string;
  }[];
  my_reels?: any[];
  liked_reels?: any[];
}

const sanitizeUserId = (id: string | number) => String(id).replace(/^user-/, '');

export const fetchUserProfile = async (userId: string | number): Promise<UserProfileInfo | null> => {
  try {
    const rawId = sanitizeUserId(userId);
    const API_BASE_URL = getApiBaseUrl();
    const data = await apiClient.get(`${API_BASE_URL}/users/${rawId}/profile`);
    return data.data;
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin profile:", error);
    return null;
  }
};

export interface ChefInfo {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
  follower_count: number;
}

export const fetchPopularChefs = async (): Promise<ChefInfo[]> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const data = await apiClient.get(`${API_BASE_URL}/users/popular-chefs`);
    return data.data || [];
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách popular chefs:", error);
    return [];
  }
};


const SOCIAL_API_URL = getApiBaseUrl();

export const followUser = async (userId: number | string) => {
    try {
        const rawId = sanitizeUserId(userId);
        const resData = await apiClient.post(`${SOCIAL_API_URL}/users/${rawId}/follow`);
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi followUser:", error);
        throw error;
    }
};

export const unfollowUser = async (userId: number | string) => {
    try {
        const rawId = sanitizeUserId(userId);
        const resData = await apiClient.delete(`${SOCIAL_API_URL}/users/${rawId}/follow`);
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi unfollowUser:", error);
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
  userId: string | number,
  kind: 'followers' | 'following',
  page: number,
  limit: number
): Promise<FollowListResponse> => {
  try {
    const rawId = sanitizeUserId(userId);
    const json = await apiClient.get(`${SOCIAL_API_URL}/users/${rawId}/${kind}?page=${page}&limit=${limit}`);
    return json.data || EMPTY_FOLLOW_LIST;
  } catch (error) {
    console.error(`❌ Lỗi lấy danh sách ${kind}:`, error);
    return EMPTY_FOLLOW_LIST;
  }
};

// Danh sách người đang follow tài khoản userId
export const fetchUserFollowers = (userId: string | number, page: number = 1, limit: number = 20): Promise<FollowListResponse> =>
  fetchFollowList(userId, 'followers', page, limit);

// Danh sách người mà userId đang follow
export const fetchUserFollowing = (userId: string | number, page: number = 1, limit: number = 20): Promise<FollowListResponse> =>
  fetchFollowList(userId, 'following', page, limit);
