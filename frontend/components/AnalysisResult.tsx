import React from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import { AIAnalysisResult } from '../services/aiService';
import { saveRecipe } from '../services/storageService';

interface AnalysisResultProps {
  isLoading: boolean;
  resultData: AIAnalysisResult | null;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ isLoading, resultData }) => {
  const handleSave = async () => {
    if (resultData) {
      const success = await saveRecipe(resultData);
      if (success) {
        Alert.alert("Thành công! 🎉", "Đã lưu công thức vào máy.");
      } else {
        Alert.alert("Lỗi", "Không thể lưu lúc này.");
      }
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
          <View style={styles.divider} />
          {resultData.instructions.map((step, index) => (
            <Text key={index} style={styles.stepText}>{step}</Text>
          ))}
        </View>

        <View style={styles.saveButtonContainer}>
          <Button title="❤️ Lưu công thức này" color="#ff4757" onPress={handleSave} />
        </View>

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
    flex: 1, // Để nội dung dài có thể cuộn được
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
  }
});