import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

export interface RecipeSummary {
  id: number;
  title: string;
  image: string | null;
  cook_time_minutes: number | null;
  difficulty: string | null;
  author: { id: number; name: string; avatar: string | null } | null;
  ratings_avg: number;
  ratings_count: number;
  comments_count: number;
  created_at: string;
}

// TÌM KIẾM MÓN ĂN TRONG CỘNG ĐỒNG (Gọi API backend /api/search/recipes)
export const searchCommunityRecipes = async (keyword: string, page: number = 1, limit: number = 10): Promise<{ items: RecipeSummary[], pagination: any }> => {
  try {
    console.log(`🔎 Đang tìm kiếm món ăn với từ khóa: ${keyword}`);
    const queryParams = new URLSearchParams({
      q: keyword,
      page: page.toString(),
      limit: limit.toString()
    });

    // Gọi API của search_route.py
    const API_SEARCH = `${getApiBaseUrl()}/search`;
    const json = await apiClient.get(`${API_SEARCH}/recipes?${queryParams.toString()}`);
    return json.data || { items: [], pagination: {} };
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm công thức cộng đồng:", error);
    return { items: [], pagination: {} };
  }
};
