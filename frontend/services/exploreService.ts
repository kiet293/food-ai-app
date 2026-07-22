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
