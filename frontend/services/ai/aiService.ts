import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

// cấu trúc dữ liệu cho phân tích món ăn
export interface AIAnalysisResult {
  ingredients: { name: string; probability: number }[];
  recipeName: string;
  instructions: string[];
  imageUrl?: string;
}

const API_AI = `${getApiBaseUrl()}/ai`;

// GỬI ẢNH LÊN CHO AI PHÂN TÍCH
export const analyzeImagesWithAI = async (imageUris: string[]): Promise<AIAnalysisResult> => {
  try {
    // 1. Chuẩn bị thùng hàng. Đóng gói ảnh vào FormData
    const formData = new FormData();

    // 2. Lặp qua từng bức ảnh người dùng chọn và nhét vào thùng
    for (let index = 0; index < imageUris.length; index++) {
      const uri = imageUris[index];
      // Trích xuất tên file và định dạng để Server hiểu
      const filename = uri.split('/').pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      let appended = false;
      // Nếu môi trường hỗ trợ Blob (WinterCG fetch) và không bật RN native fetch
      if (process.env.EXPO_PUBLIC_USE_RN_FETCH !== '1' && typeof globalThis.fetch === 'function') {
        try {
          const res = await fetch(uri);
          const blob = await res.blob();
          if (blob && blob.size > 0) {
            formData.append('image_files', blob, filename);
            appended = true;
          }
        } catch {
          // Fallback bên dưới
        }
      }

      if (!appended) {
        formData.append('image_files', {
          uri: uri,
          name: filename,
          type: type,
        } as any);
      }
    }

    console.log("🚀 Đang gửi", imageUris.length, "bức ảnh lên Server...");
    return await apiClient.post(`${API_AI}/analyze`, formData, { timeoutMs: 120000 });
  } catch (error) {
    console.error("❌ Lỗi kết nối Server:", error);
    return {
      ingredients: [],
      recipeName: "Lỗi kết nối Server",
      instructions: [
        "Không thể kết nối đến máy tính của bạn.",
        "Hãy kiểm tra lại xem Server FastAPI đã chạy chưa, hoặc kiểm tra lại đường truyền mạng nhé."
      ]
    };
  }
};

// Gửi yêu cầu đổi món cho đầu bếp AI
export const requestNewRecipe = async (
  ingredients: string[],
  currentRecipe: string,
  userMessage: string
): Promise<AIAnalysisResult | null> => {
  try {
    console.log(`💬 Đang yêu cầu AI đổi món: "${userMessage}"...`);
    return await apiClient.post(`${API_AI}/chat`, {
      ingredients: ingredients,
      current_recipe: currentRecipe,
      user_message: userMessage
    }, { timeoutMs: 120000 });
  } catch (error) {
    console.error("❌ Lỗi Chat AI:", error);
    return null;
  }
};

// TÌM KIẾM MÓN ĂN TỪ NGUYÊN LIỆU (Dạng Text)
export const searchRecipes = async (ingredients: string[]): Promise<{ recipes: AIAnalysisResult[] }> => {
  try {
    console.log("🔎 Đang gửi danh sách nguyên liệu để tìm kiếm món ăn...");
    return await apiClient.post(`${API_AI}/search`, { ingredients }, { timeoutMs: 120000 });
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm công thức:", error);
    return { recipes: [] };
  }
};
