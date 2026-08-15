import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

export interface CollectionFolder {
  id: string;
  name: string;
  recipeCount: number;
  coverImage: string;
  createdAt?: string;
}

export interface CollectionDetail extends CollectionFolder {
  recipes: any[];
}

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
const COLLECTIONS_API_URL = `${getApiBaseUrl()}/collections`;

/**
 * Lấy danh sách bộ sưu tập của người dùng hiện tại từ Database
 */
export const getCollections = async (): Promise<CollectionFolder[]> => {
  try {
    console.log("📚 Đang tải danh sách bộ sưu tập...");
    const data = await apiClient.get(COLLECTIONS_API_URL);
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id?.toString() || '',
      name: item.name || 'Bộ sưu tập không tên',
      recipeCount: item.recipe_count || 0,
      coverImage: item.cover_image || DEFAULT_COVER_IMAGE,
      createdAt: item.created_at,
    }));
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy danh sách bộ sưu tập:", error.message || error);
    return [];
  }
};

/**
 * Tạo bộ sưu tập mới
 */
export const createCollection = async (name: string, coverImage?: string): Promise<CollectionFolder | null> => {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Tên bộ sưu tập không được để trống");
    }

    const item = await apiClient.post(COLLECTIONS_API_URL, {
      name: trimmedName,
      cover_image: coverImage || null,
    });

    return {
      id: item.id?.toString() || '',
      name: item.name || trimmedName,
      recipeCount: item.recipe_count || 0,
      coverImage: item.cover_image || DEFAULT_COVER_IMAGE,
      createdAt: item.created_at,
    };
  } catch (error: any) {
    console.error("❌ Lỗi khi tạo bộ sưu tập:", error.message || error);
    throw error;
  }
};

/**
 * Xóa bộ sưu tập
 */
export const deleteCollection = async (id: string): Promise<boolean> => {
  try {
    if (!id) return false;
    await apiClient.delete(`${COLLECTIONS_API_URL}/${id}`);
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi khi xóa bộ sưu tập:", error.message || error);
    throw error;
  }
};

/**
 * Thêm công thức vào bộ sưu tập
 */
export const addRecipeToCollection = async (collectionId: string, recipeId: string): Promise<boolean> => {
  try {
    await apiClient.post(`${COLLECTIONS_API_URL}/${collectionId}/recipes/${recipeId}`);
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi thêm công thức vào bộ sưu tập:", error.message || error);
    throw error;
  }
};

/**
 * Xóa công thức khỏi bộ sưu tập
 */
export const removeRecipeFromCollection = async (collectionId: string, recipeId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`${COLLECTIONS_API_URL}/${collectionId}/recipes/${recipeId}`);
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xóa công thức khỏi bộ sưu tập:", error.message || error);
    throw error;
  }
};

/**
 * Lấy chi tiết bộ sưu tập
 */
export const getCollectionDetail = async (id: string): Promise<CollectionDetail | null> => {
  try {
    const item = await apiClient.get(`${COLLECTIONS_API_URL}/${id}`);
    if (!item) return null;

    return {
      id: item.id?.toString() || '',
      name: item.name || '',
      recipeCount: item.recipe_count || 0,
      coverImage: item.cover_image || DEFAULT_COVER_IMAGE,
      createdAt: item.created_at,
      recipes: item.recipes || [],
    };
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy chi tiết bộ sưu tập:", error.message || error);
    return null;
  }
};

/**
 * Lấy danh sách ID các bộ sưu tập đang chứa món ăn này
 */
export const getCollectionsContainingRecipe = async (recipeId: string | number): Promise<string[]> => {
  try {
    const data = await apiClient.get(`${COLLECTIONS_API_URL}/by-recipe/${recipeId}`);
    const idList = Array.isArray(data) ? data : (Array.isArray(data?.collection_ids) ? data.collection_ids : []);
    return idList.map((id: any) => id.toString());
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy danh sách collection chứa công thức:", error.message || error);
    return [];
  }
};

/**
 * Lấy tất cả công thức đã lưu trong TẤT CẢ bộ sưu tập
 */
export const getAllRecipesInCollections = async (): Promise<any[]> => {
  try {
    const data = await apiClient.get(`${COLLECTIONS_API_URL}/recipes/all`);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy tất cả món ăn trong bộ sưu tập:", error.message || error);
    return [];
  }
};
