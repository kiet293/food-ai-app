import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';
import { AuthorInfo } from '../shared/types';
import { CommentInfo } from '../community/communityService';
import { AIAnalysisResult } from '../ai/aiService';

export interface ExploreGridItem {
  id: number;
  image: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

export interface TrendingRecipeItem {
  id: number | string;
  title: string;
  author: any;
  image: string;
  badge?: string;
  cookTime?: string;
  saved?: boolean;
  save_count?: number;
  ratings_avg?: number;
  ratings_count?: number;
}

const API_BASE_URL = getApiBaseUrl();

export const fetchCategories = async (): Promise<CategoryItem[]> => {
  try {
    const data = await apiClient.get(`${API_BASE_URL}/recipes/categories`);
    if (data.status === 'success') {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchTrendingRecipes = async (limit: number = 10): Promise<TrendingRecipeItem[]> => {
  try {
    const data = await apiClient.get(`${API_BASE_URL}/recipes/trending?limit=${limit}`);
    if (data.status === 'success') {
      return data.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        author: item.author?.name || 'Chef',
        image: item.image,
        badge: item.badge,
        cookTime: item.cook_time_minutes ? `${item.cook_time_minutes} phút` : '30 phút',
        saved: item.is_in_collection || false,
        savesCount: item.save_count || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching trending recipes:', error);
    return [];
  }
};

export const createRecipe = async (formData: FormData): Promise<boolean> => {
  try {
    const data = await apiClient.post(`${API_BASE_URL}/recipes/`, formData);
    return data.status === 'success';
  } catch (error) {
    console.error('Error creating recipe:', error);
    return false;
  }
};

export const updateRecipe = async (id: string, formData: FormData): Promise<boolean> => {
  try {
    const data = await apiClient.put(`${API_BASE_URL}/recipes/${id}`, formData);
    return data.status === 'success';
  } catch (error) {
    console.error('Error updating recipe:', error);
    return false;
  }
};

export interface ExploreGridResponse {
  items: ExploreGridItem[];
  next_cursor: number | null;
}

export const fetchExploreGrid = async (cursor: number | null = null, limit: number = 18, tag?: string): Promise<ExploreGridResponse> => {
  try {
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });
    if (cursor !== null) {
      queryParams.append('cursor', cursor.toString());
    }
    if (tag && tag !== 'Tất Cả') {
      queryParams.append('tag', tag);
    }

    const json = await apiClient.get(`${API_BASE_URL}/recipes/explore-grid?${queryParams.toString()}`);
    return json.data || { items: [], next_cursor: null };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách explore-grid:", error);
    return { items: [], next_cursor: null };
  }
};

export interface ExploreFeedItem {
  id: number;
  title: string;
  description?: string | null;
  image: string;
  cook_time_minutes: number | null;
  difficulty: string | null;
  author: AuthorInfo | null;
  ratings_avg: number;
  ratings_count: number;
  comments_count: number;
  favorites_count: number;
  is_favorited: boolean;
  is_in_collection?: boolean;
  cooked_count: number;
  created_at: string | null;
}

export interface ExploreFeedResponse {
  items: ExploreFeedItem[];
  next_cursor: number | null;
}

export const fetchExploreFeed = async (startId: number | null = null, limit: number = 5, tag: string | null = null): Promise<ExploreFeedResponse> => {
  try {
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });
    if (startId !== null) {
      queryParams.append('start_id', startId.toString());
    }
    if (tag) {
      queryParams.append('tag', tag);
    }

    const json = await apiClient.get(`${API_BASE_URL}/recipes/explore-feed?${queryParams.toString()}`);
    return json.data || { items: [], next_cursor: null };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách explore-feed:", error);
    return { items: [], next_cursor: null };
  }
};

export const fetchFollowingFeed = async (startId: number | null = null, limit: number = 5, tag: string | null = null): Promise<ExploreFeedResponse> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      return { items: [], next_cursor: null };
    }

    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });
    if (startId !== null) {
      queryParams.append('start_id', startId.toString());
    }
    if (tag) {
      queryParams.append('tag', tag);
    }

    const json = await apiClient.get(`${API_BASE_URL}/recipes/following-feed?${queryParams.toString()}`);
    return json.data || { items: [], next_cursor: null };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách following-feed:", error);
    return { items: [], next_cursor: null };
  }
};

export interface RecipeDetails extends ExploreFeedItem {
  description?: string;
  category?: string;
  ingredients?: any;
  instructions?: any;
  servings?: number;
  comments?: CommentInfo[];
}

export const fetchRecipeDetails = async (id: number): Promise<RecipeDetails | null> => {
  try {
    const json = await apiClient.get(`${API_BASE_URL}/recipes/${id}`);
    return json.data || null;
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết công thức:", error);
    return null;
  }
};

// ===== Các API "sổ tay công thức" (được AI phân tích rồi lưu vào DB) =====

export interface PopularRecipe {
  id: string;
  recipeName: string;
  scanCount: number;
  saveCount: number;
  ingredients: Array<{ name: string; probability: number }>;
  instructions: string[];
  imageUrl?: string;
}

// LƯU CÔNG THỨC VÀO DATABASE
export const saveRecipeToDatabase = async (recipeData: AIAnalysisResult): Promise<boolean> => {
  try {
    console.log("💾 Đang gửi yêu cầu lưu công thức...");
    const result = await apiClient.post(`${API_BASE_URL}/recipes/save`, recipeData);
    console.log("✅ Server phản hồi:", result.message);
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi khi lưu công thức:", error.message);
    throw error;
  }
};

// LẤY DANH SÁCH CÔNG THỨC TRONG SỔ TAY
export const getSavedRecipes = async () => {
  try {
    console.log("📖 Đang tải Sổ tay nấu ăn...");
    const data = await apiClient.get(`${API_BASE_URL}/recipes/list`);
    return data.map((item: any) => ({
      id: item.id.toString(),
      recipeName: item.recipe_name,
      ingredients: item.ingredients,
      instructions: item.instructions,
      imageUrl: item.image_url,
      savedAt: new Date(item.created_at).toLocaleDateString('vi-VN')
    }));
  } catch (error) {
    console.error("❌ Lỗi khi tải Sổ tay:", error);
    return [];
  }
};

// Hàm XÓA công thức khỏi Database
export const deleteRecipe = async (id: string): Promise<boolean> => {
  try {
    console.log("🗑️ Đang yêu cầu Server xóa công thức ID:", id);
    await apiClient.delete(`${API_BASE_URL}/recipes/${id}`);
    console.log("✅ Server đã xác nhận xóa thành công!");
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi xóa công thức:", error);
    return false;
  }
};

// LẤY DANH SÁCH 10 MÓN ĂN PHỔ BIẾN
export const getPopularRecipes = async (): Promise<PopularRecipe[]> => {
  try {
    console.log("🔥 Đang tải danh sách món ăn phổ biến...");
    const data = await apiClient.get(`${API_BASE_URL}/recipes/popular`);
    return data.map((item: any) => ({
      id: item.id.toString(),
      recipeName: item.recipe_name,
      scanCount: item.scan_count,
      saveCount: item.save_count,
      ingredients: item.ingredients,
      instructions: item.instructions,
      imageUrl: item.image_url,
    }));
  } catch (error) {
    console.error("❌ Lỗi khi tải danh sách phổ biến:", error);
    return [];
  }
};
