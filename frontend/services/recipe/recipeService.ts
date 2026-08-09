import { getApiBaseUrl } from '../shared/apiConfig';
import { getToken } from '../auth/authService';
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

export const fetchCategories = async (): Promise<CategoryItem[]> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/recipes/categories`);
    const data = await response.json();
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
    const API_BASE_URL = getApiBaseUrl();
    const token = await getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/recipes/trending?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (data.status === 'success') {
      // Map về cấu trúc của TrendingRecipeItem để UI dễ hiển thị
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
    const token = await getToken();
    const response = await fetch(`${getApiBaseUrl()}/recipes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Error creating recipe:', error);
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

    const API_BASE_URL = getApiBaseUrl();

    const response = await fetch(`${API_BASE_URL}/recipes/explore-grid?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Server explore-grid đang lỗi');
    }

    const json = await response.json();
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
  save_count: number;
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

    const API_RECIPES = `${getApiBaseUrl()}/recipes`;
    const token = await getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_RECIPES}/explore-feed?${queryParams.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Server explore-feed đang lỗi');
    }

    const json = await response.json();
    return json.data || { items: [], next_cursor: null };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách explore-feed:", error);
    return { items: [], next_cursor: null };
  }
};

export const fetchFollowingFeed = async (startId: number | null = null, limit: number = 5, tag: string | null = null): Promise<ExploreFeedResponse> => {
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

    const API_RECIPES = `${getApiBaseUrl()}/recipes`;
    const token = await getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Following feed requires authentication
      return { items: [], next_cursor: null };
    }

    const response = await fetch(`${API_RECIPES}/following-feed?${queryParams.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server following-feed đang lỗi: ${errText}`);
    }

    const json = await response.json();
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
    const API_BASE_URL = getApiBaseUrl();
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Không thể tải chi tiết công thức');
    }

    const json = await response.json();
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
    const token = await getToken();
    const response = await fetch(`${getApiBaseUrl()}/recipes/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Server từ chối lưu dữ liệu');
    }

    const result = await response.json();
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
    const token = await getToken();
    const response = await fetch(`${getApiBaseUrl()}/recipes/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Server từ chối cung cấp dữ liệu');
    }

    const data = await response.json();
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
}

// Hàm XÓA công thức khỏi Database
export const deleteRecipe = async (id: string): Promise<boolean> => {
  try {
    console.log("🗑️ Đang yêu cầu Server xóa công thức ID:", id);
    const token = await getToken();
    const response = await fetch(`${getApiBaseUrl()}/recipes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Server từ chối xóa dữ liệu');
    }

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
    const response = await fetch(`${getApiBaseUrl()}/recipes/popular`);

    if (!response.ok) {
      throw new Error('Server từ chối cung cấp dữ liệu xu hướng');
    }

    const data = await response.json();
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
