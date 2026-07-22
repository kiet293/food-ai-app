import Constants from 'expo-constants';

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
    
    // Gọi API của search_route.py (Lưu ý: API này đang nằm trong nhóm /api/search)
    const hostUri = Constants.expoConfig?.hostUri;
    const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
    const API_SEARCH = `http://${ipAddress}:5000/api/search`;

    const response = await fetch(`${API_SEARCH}/recipes?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Server community search đang lỗi');
    }

    const json = await response.json();
    // Server trả về: { status: "success", data: { items: [...], pagination: {...} } }
    return json.data || { items: [], pagination: {} };
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm công thức cộng đồng:", error);
    return { items: [], pagination: {} };
  }
};
