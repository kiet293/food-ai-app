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

export const fetchUserProfile = async (userId: string): Promise<UserProfileInfo | null> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const data = await apiClient.get(`${API_BASE_URL}/users/${userId}/profile`);
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
