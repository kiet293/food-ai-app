import Constants from 'expo-constants';

export interface ExploreGridItem {
  id: number;
  image: string;
}

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
    const hostUri = Constants.expoConfig?.hostUri;
    const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
    const API_RECIPES = `http://${ipAddress}:5000/api/recipes`;

    const response = await fetch(`${API_RECIPES}/explore-grid?${queryParams.toString()}`, {
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
export interface RecipeDetails extends ExploreFeedItem {
  description?: string;
  category?: string;
  ingredients?: any;
  instructions?: any;
  servings?: number;
  comments?: any[];
}

export const fetchRecipeDetails = async (id: number): Promise<RecipeDetails | null> => {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
    const API_RECIPES = `http://${ipAddress}:5000/api/recipes`;

    const response = await fetch(`${API_RECIPES}/${id}`, {
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
