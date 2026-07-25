import { getApiBaseUrl } from './exploreService';

export interface TagInfo {
  id: number;
  name: string;
  slug: string;
  usage_count: number;
}

export const fetchHotTags = async (): Promise<TagInfo[]> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/tags/hot`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Server tags/hot đang lỗi');
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách hot tags:", error);
    return [];
  }
};
