import Constants from 'expo-constants';
import { getToken } from './authService';

export const getApiBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${ipAddress}:5000/api`;
};
export interface ExploreGridItem {
  id: number;
  image: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
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

export const fetchExploreGrid = async (cursor: number | null = null, limit: number = 18): Promise<ExploreGridResponse> => {
  try {
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });
    if (cursor !== null) {
      queryParams.append('cursor', cursor.toString());
    }
    
    // Gọi API
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

export interface AuthorInfo {
  id: number;
  name: string;
  handle: string;
  avatar: string;
}

export interface ExploreFeedItem {
  id: number;
  title: string;
  image: string;
  cook_time_minutes: number | null;
  difficulty: string | null;
  author: AuthorInfo | null;
  ratings_avg: number;
  ratings_count: number;
  comments_count: number;
  save_count: number;
  cooked_count: number;
  created_at: string | null;
}

export interface ExploreFeedResponse {
  items: ExploreFeedItem[];
  next_cursor: number | null;
}

export const fetchExploreFeed = async (startId: number | null = null, limit: number = 5): Promise<ExploreFeedResponse> => {
  try {
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });
    if (startId !== null) {
      queryParams.append('start_id', startId.toString());
    }
    
    // Gọi API
    const hostUri = Constants.expoConfig?.hostUri;
    const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
    const API_RECIPES = `http://${ipAddress}:5000/api/recipes`;

    const response = await fetch(`${API_RECIPES}/explore-feed?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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
export interface CommentInfo {
  id: number;
  content: string;
  created_at: string;
  user: AuthorInfo | null;
  is_author?: boolean;
  replies?: CommentInfo[];
  parent_comment_id?: number;
}

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

    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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
