// export const analyzeImageWithAI = async (imageUri: string): Promise<string> => {
//   // ĐÂY LÀ NƠI SAU NÀY BẠN SẼ DÙNG AXIOS ĐỂ GỌI API THẬT
//   return new Promise((resolve) => {
//     // Tạm thời dùng setTimeout để mô phỏng việc chờ Server xử lý mất 3 giây
//     setTimeout(() => {
//       resolve(
//         "🤖 AI nhận diện được:\n- Cà chua (98%)\n- Trứng gà (95%)\n\n🍲 Gợi ý món: Canh Cà Chua Trứng"
//       );
//     }, 3000);
//   });
// };


// Định nghĩa cấu trúc dữ liệu mà AI sẽ trả về
// export interface AIAnalysisResult {
//   ingredients: Array<{ name: string; probability: number }>;
//   recipeName: string;
//   instructions: string[];
// }

// export const analyzeImageWithAI = async (imageUri: string): Promise<AIAnalysisResult> => {
//   return new Promise((resolve) => {
//     // Giả lập Server đang xử lý mất 3 giây
//     setTimeout(() => {
//       resolve({
//         ingredients: [
//           { name: "Cà chua", probability: 98 },
//           { name: "Trứng gà", probability: 95 }
//         ],
//         recipeName: "Canh Cà Chua Trứng",
//         instructions: [
//           "1. Rửa sạch cà chua, thái múi cau. Đánh tan trứng gà ra bát.",
//           "2. Phi thơm hành tím, cho cà chua vào xào mềm để tạo màu.",
//           "3. Đổ lượng nước vừa đủ vào nồi đun sôi, nêm nếm gia vị.",
//           "4. Đổ từ từ trứng vào nồi, khuấy nhẹ tay để tạo vân mây.",
//           "5. Tắt bếp, rắc hành lá và tiêu lên trên. Thưởng thức nóng!"
//         ]
//       });
//     }, 3000);
//   });
// };

import Constants from 'expo-constants';

// Vẫn giữ nguyên cấu trúc dữ liệu
export interface AIAnalysisResult {
  ingredients: Array<{ name: string; probability: number }>;
  recipeName: string;
  instructions: string[];
}

// Hàm tự động bắt IP máy tính
const getBackendUrl = () => {
  // hostUri sẽ chứa chuỗi dạng "192.168.1.23:8081"
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    // Cắt đôi chuỗi ở dấu ":", lấy phần IP ở đằng trước
    const ipAddress = hostUri.split(':')[0];
    // Ghép với cổng 5000 của Python
    return `http://${ipAddress}:5000/api/analyze`;
  }

  // Đề phòng lỗi thì trả về localhost
  return 'http://localhost:5000/api/analyze';
};

// ⚠️ THAY ĐỊA CHỈ IP DƯỚI ĐÂY BẰNG IPv4 CỦA MÁY TÍNH BẠN
// Cách 1: Set cứng ip của máy vào 
// const SERVER_URL = 'http://192.168.1.23:5000/api/analyze';

// Cách 2: "Ăn theo" IP của Expo
const SERVER_URL = getBackendUrl();

// Cách 3: Dùng ngrok
//const SERVER_URL = 'https://spoiling-decorator-polish.ngrok-free.dev/api/analyze';


export const analyzeImageWithAI = async (imageUri: string): Promise<AIAnalysisResult> => {
  try {
    // 1. Đóng gói ảnh vào FormData
    const formData = new FormData();

    // React Native bắt buộc phải có đủ uri, name, và type để gửi file
    formData.append('image_file', {
      uri: imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    // 2. Gửi gói hàng qua mạng đến Server
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error('Server AI đang từ chối kết nối');
    }

    // 3. Mở kiện hàng Server gửi về (JSON)
    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Lỗi kết nối Server:", error);
    // Trả về một kết quả báo lỗi để app không bị crash
    return {
      ingredients: [],
      recipeName: "Lỗi kết nối Server",
      instructions: ["Không thể kết nối đến máy tính của bạn.", "Hãy kiểm tra lại địa chỉ IP và đảm bảo Server FastAPI đang chạy."]
    };
  }
};