import { getApiBaseUrl } from '../shared/apiConfig';
import { getToken } from '../auth/authService';

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

/**
 * Lấy danh sách bộ sưu tập của người dùng hiện tại từ Database
 */
export const getCollections = async (): Promise<CollectionFolder[]> => {
  try {
    console.log("📚 Đang tải danh sách bộ sưu tập...");
    const token = await getToken();
    if (!token) {
      console.warn("⚠️ Người dùng chưa đăng nhập, không thể lấy bộ sưu tập");
      return [];
    }

    const response = await fetch(`${getApiBaseUrl()}/collections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Lỗi server: ${response.status}`);
    }

    const data = await response.json();
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

    const token = await getToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để tạo bộ sưu tập");
    }

    const response = await fetch(`${getApiBaseUrl()}/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: trimmedName,
        cover_image: coverImage || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Không thể tạo bộ sưu tập");
    }

    const item = await response.json();
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
    const token = await getToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để thực hiện thao tác này");
    }

    const response = await fetch(`${getApiBaseUrl()}/collections/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Không thể xóa bộ sưu tập");
    }

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
    const token = await getToken();
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${getApiBaseUrl()}/collections/${collectionId}/recipes/${recipeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Không thể thêm công thức vào bộ sưu tập");
    }

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
    const token = await getToken();
    if (!token) throw new Error("Vui lòng đăng nhập");

    const response = await fetch(`${getApiBaseUrl()}/collections/${collectionId}/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Không thể xóa món ăn khỏi bộ sưu tập");
    }

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
    const token = await getToken();
    if (!token) return null;

    const response = await fetch(`${getApiBaseUrl()}/collections/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const item = await response.json();
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
    const token = await getToken();
    if (!token) return [];

    const response = await fetch(`${getApiBaseUrl()}/collections/by-recipe/${recipeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
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
    const token = await getToken();
    if (!token) return [];

    const response = await fetch(`${getApiBaseUrl()}/collections/recipes/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy tất cả món ăn trong bộ sưu tập:", error.message || error);
    return [];
  }
};
