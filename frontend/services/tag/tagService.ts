import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

export interface TagInfo {
  id: number;
  name: string;
  slug: string;
  usage_count: number;
}

export const fetchHotTags = async (): Promise<TagInfo[]> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const data = await apiClient.get(`${API_BASE_URL}/tags/hot`);
    return data || [];
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách hot tags:", error);
    return [];
  }
};
