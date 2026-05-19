import Constants from 'expo-constants';
import { getToken } from './authService';

// cấu trúc dữ liệu
export interface AIAnalysisResult {
  ingredients: Array<{ name: string; probability: number }>;
  recipeName: string;
  instructions: string[];
  imageUrl?: string;
}

// Hàm tự động bắt IP máy tính
const getBaseUrl = () => {
  // hostUri sẽ chứa chuỗi dạng "192.168.1.23:8081"
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    // Cắt đôi chuỗi ở dấu ":", lấy phần IP ở đằng trước
    const ipAddress = hostUri.split(':')[0];
    // Ghép với cổng 5000 của Python
    return `http://${ipAddress}:5000/api`;
  }

  // Đề phòng lỗi thì trả về localhost
  return 'http://localhost:5000/api';
};

// ⚠️ THAY ĐỊA CHỈ IP DƯỚI ĐÂY BẰNG IPv4 CỦA MÁY TÍNH BẠN
// Cách 1: Set cứng ip của máy vào 
// const BASE_URL = 'http://192.168.1.23:5000/api';

// Cách 2: "Ăn theo" IP của Expo
const BASE_URL = getBaseUrl();

// Cách 3: Dùng ngrok
//const BASE_URL = 'https://spoiling-decorator-polish.ngrok-free.dev/api';

const ANALYZE_URL = `${BASE_URL}/analyze`;       // Đường dẫn gửi ảnh cho AI
const SAVE_RECIPE_URL = `${BASE_URL}/recipes/save`; // Đường dẫn lưu vào Database
const GET_RECIPES_URL = `${BASE_URL}/recipes/list`; // Đường dẫn lấy danh sách công thức trong Database
const CHAT_URL = `${BASE_URL}/chat`; // Đường dẫn chatbot

// GỬI ẢNH LÊN CHO AI PHÂN TÍCH
export const analyzeImagesWithAI = async (imageUris: string[]): Promise<AIAnalysisResult> => {
  try {
    // 1. Chuẩn bị thùng hàng. Đóng gói ảnh vào FormData
    const formData = new FormData();

    // 2. Lặp qua từng bức ảnh người dùng chọn và nhét vào thùng
    imageUris.forEach((uri, index) => {
      // Trích xuất tên file và định dạng để Server hiểu
      const filename = uri.split('/').pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('image_files', {
        uri: uri,
        name: filename,
        type: type,
      } as any);
    });

    // 3. Gọi anh shipper chở hàng đi
    console.log("🚀 Đang gửi", imageUris.length, "bức ảnh lên Server...");
    const response = await fetch(ANALYZE_URL, {
      method: 'POST',
      body: formData,
      // React Native sẽ tự động tạo Content-Type kèm boundary (dấu phân cách file)
    });

    if (!response.ok) {
      throw new Error('Server AI đang từ chối kết nối');
    }

    // 4. Mở kiện hàng Server gửi về (JSON)
    const data = await response.json();
    return data;

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

// LƯU CÔNG THỨC VÀO DATABASE
export const saveRecipeToDatabase = async (recipeData: AIAnalysisResult): Promise<boolean> => {
  try {
    console.log("💾 Đang gửi yêu cầu lưu công thức...");
    const token = await getToken();
    const response = await fetch(SAVE_RECIPE_URL, { // Sử dụng SAVE_RECIPE_URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Lưu ý: Chỗ này BẮT BUỘC phải có Content-Type là JSON
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(recipeData), // Biến Object thành chuỗi JSON để gửi đi
    });

    if (!response.ok) {
      // 1. MỞ KHÓA LỖI: Bóc tách gói JSON báo lỗi từ FastAPI (nằm trong trường "detail")
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Server từ chối lưu dữ liệu');
    }

    const result = await response.json();
    console.log("✅ Server phản hồi:", result.message);
    return true; // Báo hiệu lưu thành công

  } catch (error: any) {
    console.error("❌ Lỗi khi lưu công thức:", error.message);
    // Ném thẳng lỗi này ra ngoài cho giao diện (AnalysisResult) xử lý
    throw error;
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
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients: ingredients,
        current_recipe: currentRecipe,
        user_message: userMessage
      }),
    });

    if (!response.ok) {
      throw new Error('Server AI chat đang lỗi');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("❌ Lỗi Chat AI:", error);
    return null;
  }
};

// LẤY DANH SÁCH CÔNG THỨC TRONG SỔ TAY
export const getSavedRecipes = async () => {
  try {
    console.log("📖 Đang tải Sổ tay nấu ăn...");
    const token = await getToken();
    const response = await fetch(GET_RECIPES_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Server từ chối cung cấp dữ liệu');
    }

    const data = await response.json();
    // Ánh xạ (Map) dữ liệu từ Database sang đúng chuẩn của UI
    return data.map((item: any) => ({
      id: item.id.toString(), // Chuyển ID số của DB thành chuỗi
      recipeName: item.recipe_name, // Chuyển recipe_name thành recipeName
      ingredients: item.ingredients,
      instructions: item.instructions,
      imageUrl: item.image_url,
      // Định dạng lại ngày giờ cho đẹp (VD: 05/05/2026)
      savedAt: new Date(item.created_at).toLocaleDateString('vi-VN')
    }));
  } catch (error) {
    console.error("❌ Lỗi khi tải Sổ tay:", error);
    return []; // Bị lỗi thì trả về mảng rỗng để App không bị crash
  }
}

// Hàm XÓA công thức khỏi Database
export const deleteRecipe = async (id: string): Promise<boolean> => {
  try {
    // Gọi API xóa với method DELETE
    console.log("🗑️ Đang yêu cầu Server xóa công thức ID:", id);
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/recipes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Server từ chối xóa dữ liệu');
    }

    console.log("✅ Server đã xác nhận xóa thành công!");
    return true;

  } catch (error) {
    console.error("❌ Lỗi khi xóa công thức:", error);
    return false;
  }
}