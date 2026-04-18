import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { ActionButtons } from "../../components/ActionButtons";
import { AnalysisResult } from "../../components/AnalysisResult";
import { ImagePreview } from "../../components/ImagePreview";
import { useImageAnalysis } from "../../hooks/useImageAnalysis";

export default function HomeScreen() {
  const {
    image,
    isLoading,
    resultData,
    pickImage,
    openCamera,
    analyzeImage,
  } = useImageAnalysis();

  return (
    // SafeAreaView giúp nội dung không bị lẹm vào tai thỏ (Notch) của iPhone
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false} // Ẩn thanh cuộn cho đẹp
      >
        <Text style={styles.title}>🍳 Nhận diện Nguyên liệu</Text>

        <ActionButtons onOpenCamera={openCamera} onPickImage={pickImage} />

        {image && (
          <ImagePreview
            imageUri={image}
            isLoading={isLoading}
            onAnalyze={analyzeImage}
          />
        )}

        <AnalysisResult isLoading={isLoading} resultData={resultData} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1, // flexGrow quan trọng hơn flex trong ScrollView, giúp nó giãn hết màn hình nếu nội dung ngắn
    alignItems: "center",
    padding: 20,
    paddingBottom: 40, // Thêm khoảng trống ở đáy để khi cuộn xuống cùng không bị sát viền
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
    color: "#333",
  },
});
