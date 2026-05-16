import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { ActionButtons } from "../../components/ActionButtons";
import { AnalysisResult } from "../../components/AnalysisResult";
import { ImagePreview } from "../../components/ImagePreview";
import { useImageAnalysis } from "../../hooks/useImageAnalysis";

export default function HomeScreen() {
  const {
    images,
    isLoading,
    resultData,
    setResultData,
    pickImage,
    openCamera,
    analyzeImage,
  } = useImageAnalysis();

  return (
    // SafeAreaView giúp nội dung không bị lẹm vào tai thỏ (Notch) của iPhone
    <SafeAreaView style={styles.safeArea}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          // Bí kíp để bấm nút Gửi lúc bàn phím đang mở không bị lỗi nhịp
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title}>🍳 Nhận diện Nguyên liệu</Text>

          <ActionButtons onOpenCamera={openCamera} onPickImage={pickImage} />

          {images.length > 0 && (
            <ImagePreview
              imageUris={images}
              isLoading={isLoading}
              onAnalyze={analyzeImage}
            />
          )}

          <AnalysisResult
            isLoading={isLoading}
            resultData={resultData}
            onUpdateResult={setResultData}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
    color: "#333",
  },
  // Thêm style cho màn hình chờ
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  }
});