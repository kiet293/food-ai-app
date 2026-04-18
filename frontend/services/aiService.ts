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
export interface AIAnalysisResult {
  ingredients: Array<{ name: string; probability: number }>;
  recipeName: string;
  instructions: string[];
}

export const analyzeImageWithAI = async (imageUri: string): Promise<AIAnalysisResult> => {
  return new Promise((resolve) => {
    // Giả lập Server đang xử lý mất 3 giây
    setTimeout(() => {
      resolve({
        ingredients: [
          { name: "Cà chua", probability: 98 },
          { name: "Trứng gà", probability: 95 }
        ],
        recipeName: "Canh Cà Chua Trứng",
        instructions: [
          "1. Rửa sạch cà chua, thái múi cau. Đánh tan trứng gà ra bát.",
          "2. Phi thơm hành tím, cho cà chua vào xào mềm để tạo màu.",
          "3. Đổ lượng nước vừa đủ vào nồi đun sôi, nêm nếm gia vị.",
          "4. Đổ từ từ trứng vào nồi, khuấy nhẹ tay để tạo vân mây.",
          "5. Tắt bếp, rắc hành lá và tiêu lên trên. Thưởng thức nóng!"
        ]
      });
    }, 3000);
  });
};
