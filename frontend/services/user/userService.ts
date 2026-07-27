import { getApiBaseUrl } from '../shared/apiConfig';
import { getToken } from '../auth/authService';

export interface UserProfileInfo {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  made_count: number;
  want_to_make_count: number;
  follower_count: number;
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
}

export const fetchUserProfile = async (userId: string): Promise<UserProfileInfo | null> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Không thể tải thông tin profile');
    }

    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/users/popular-chefs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Server popular-chefs đang lỗi');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách popular chefs:", error);
    return [];
  }
};
