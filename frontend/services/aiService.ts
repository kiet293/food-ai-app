import Constants from 'expo-constants';

// cấu trúc dữ liệu
export interface AIAnalysisResult {
  ingredients: Array<{ name: string; probability: number }>;
  recipeName: string;
  instructions: string[];
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
    const response = await fetch(SAVE_RECIPE_URL, { // Sử dụng SAVE_RECIPE_URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Lưu ý: Chỗ này BẮT BUỘC phải có Content-Type là JSON
      },
      body: JSON.stringify(recipeData), // Biến Object thành chuỗi JSON để gửi đi
    });

    if (!response.ok) {
      throw new Error('Server từ chối lưu dữ liệu');
    }

    const result = await response.json();
    console.log("✅ Server phản hồi:", result.message);
    return true; // Báo hiệu lưu thành công

  } catch (error) {
    console.error("❌ Lỗi khi lưu công thức:", error);
    return false; // Báo hiệu lưu thất bại
  }
};