import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator, Alert, Button, StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, Image
} from 'react-native';
import { saveRecipeToDatabase, requestNewRecipe, AIAnalysisResult } from '../../services/aiService';


interface AnalysisResultProps {
  isLoading: boolean;
  resultData: AIAnalysisResult | null;
  onUpdateResult: (newData: AIAnalysisResult) => void; // Thêm Prop này để cập nhật UI
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ isLoading, resultData, onUpdateResult }) => {
  // State quản lý việc nhắn tin
  const [customMessage, setCustomMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Reset trạng thái load ảnh khi đổi món ăn mới
  useEffect(() => {
    setImageError(false);
    if (resultData?.imageUrl) {
      setIsImageLoading(true);
    }
  }, [resultData?.imageUrl]);

  const handleSaveRecipe = async () => {
    if (!resultData) return;

    try {
      // Gọi hàm lưu. Nếu không có lỗi gì xảy ra, nó sẽ chạy thẳng xuống dòng Alert Thành công
      await saveRecipeToDatabase(resultData);
      Alert.alert("Thành công! 🎉", "Đã lưu công thức vào máy.");

    } catch (error: any) {
      // Nếu Backend ném lỗi (ví dụ: lỗi 400 trùng lặp), nó sẽ nhảy ngay vào đây!
      // error.message chính là câu "Món ăn này đã có trong Sổ tay..." từ Server
      Alert.alert("Thông báo", error.message || "Không thể lưu lúc này. Hãy kiểm tra lại kết nối Server.");
    }
  };

  // Hàm xử lý gửi tin nhắn cho AI
  const handleChat = async (message: string) => {
    if (!resultData || !message.trim()) return;

    setIsChatting(true);
    // Rút trích danh sách tên nguyên liệu từ resultData hiện tại
    const ingredientNames = resultData.ingredients.map(ing => ing.name);

    // Gọi API đổi món
    const newData = await requestNewRecipe(ingredientNames, resultData.recipeName, message);

    setIsChatting(false);
    setCustomMessage(""); // Xóa trắng ô nhập

    if (newData) {
      onUpdateResult(newData); // Cập nhật lại giao diện với món ăn mới
    } else {
      Alert.alert("Lỗi kết nối", "Đầu bếp AI đang bận, vui lòng thử lại sau.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>
          AI đang phân tích, chờ xíu nhé...
        </Text>
      </View>
    );
  }

  if (resultData) {
    return (
      <View style={styles.resultContainer}>
        {/* Phần 1: Nguyên liệu nhận diện được */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Nguyên liệu phát hiện:</Text>
          {resultData.ingredients.map((item, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>• {item.name}</Text>
              <Text style={styles.confidence}>{item.probability}%</Text>
            </View>
          ))}
        </View>

        {/* Phần 2: Đề xuất món ăn & Công thức */}
        <View style={[styles.section, styles.recipeSection]}>
          <Text style={styles.sectionTitle}>🍲 Gợi ý: {resultData.recipeName}</Text>

          {/* Hiển thị ảnh món ăn vừa tìm được */}
          {resultData.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageError ? 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800' : resultData.imageUrl }}
                style={styles.recipeImage}
                resizeMode="cover"
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => {
                  console.log("❌ Lỗi load ảnh từ Pollinations AI, chuyển sang ảnh fallback...");
                  setImageError(true);
                  setIsImageLoading(false);
                }}
              />
              {isImageLoading && (
                <View style={styles.imageLoader}>
                  <ActivityIndicator size="small" color="#28a745" />
                  <Text style={styles.loaderText}>Đang vẽ ảnh bằng AI...</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.divider} />
          {resultData.instructions.map((step, index) => (
            <Text key={index} style={styles.stepText}>{step}</Text>
          ))}
        </View>

        <View style={styles.saveButtonContainer}>
          <Button title="❤️ Lưu công thức này" color="#ff4757" onPress={handleSaveRecipe} />
        </View>

        {/* PHẦN 3: KHU VỰC TRỢ LÝ ĐẦU BẾP (TÍNH NĂNG MỚI) */}
        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>🤖 Chưa ưng ý? Yêu cầu món khác:</Text>

          {/* Nút gợi ý nhanh */}
          <View style={styles.chipContainer}>
            <TouchableOpacity style={styles.chip} onPress={() => handleChat("Đổi món ăn nào có nhiều nước (nấu canh/súp)")}>
              <Text style={styles.chipText}>🍜 Món nước</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleChat("Đổi sang món chiên hoặc xào mặn")}>
              <Text style={styles.chipText}>🍳 Chiên/Xào</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleChat("Đổi sang một món chay, hoặc món healthy")}>
              <Text style={styles.chipText}>🥗 Món Healthy</Text>
            </TouchableOpacity>
          </View>

          {/* Ô nhập yêu cầu tự do */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Hoặc nhập yêu cầu riêng của bạn..."
              value={customMessage}
              onChangeText={setCustomMessage}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleChat(customMessage)}
              disabled={isChatting}
            >
              {isChatting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Thêm một khoảng trống nhỏ ở cuối để nút không bị dính chặt vào đáy màn hình */}
        <View style={{ height: 40 }} />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  loadingContainer: { marginTop: 30, alignItems: "center" },
  loadingText: { marginTop: 10, color: "#555", fontStyle: "italic" },
  resultContainer: {
    marginTop: 20,
    width: "100%",
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Tạo bóng đổ cho Android
  },
  recipeSection: {
    backgroundColor: "#f8fdf8", // Màu xanh lá rất nhạt cho công thức
    borderColor: "#c3e6cb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  ingredientName: { fontSize: 16, color: "#444" },
  confidence: { fontSize: 14, color: "#28a745", fontWeight: "bold" },
  divider: {
    height: 1,
    backgroundColor: "#c3e6cb",
    marginVertical: 10,
  },
  stepText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#444",
    marginBottom: 8,
  },
  saveButtonContainer: {
    marginTop: 5,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden', // Để bo góc nút Button trên Android
  },
  // CSS cho phần Trợ lý Đầu bếp
  chatSection: {
    backgroundColor: "#f0f4f8",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d9e2ec",
    marginTop: 10,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334e68",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8, // Khoảng cách giữa các nút
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    color: "#4a5568",
    fontSize: 14,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#3182ce",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  recipeImage: {
    width: '100%',
    height: 200,          // Chiều cao bức ảnh cố định 200px nhìn rất sang
    borderRadius: 10,     // Bo nhẹ góc ảnh cho đồng bộ với cái card
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginVertical: 12,
    backgroundColor: '#e1e4e6', // Màu nền xám nhạt hiện lên lúc ảnh đang load mạng chậm
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 244, 248, 0.8)',
  },
  loaderText: {
    marginTop: 5,
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
});