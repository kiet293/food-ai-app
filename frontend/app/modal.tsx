import React from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnalysisResult } from '@/components/AnalysisResult';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';

export default function ModalScreen() {
  const router = useRouter();
  const {
    images,
    isLoading,
    resultData,
    setResultData,
    pickImage,
    openCamera,
    analyzeImage,
    removeImage,
    clearImages,
  } = useImageAnalysis();

  const handleAnalyze = async () => {
    if (images.length === 0) {
      Alert.alert('Thông báo', 'Bạn hãy chụp hoặc tải lên ít nhất một ảnh trước đã.');
      return;
    }

    await analyzeImage();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f3ea" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <Text style={styles.headerActionText}>←</Text>
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Thêm ảnh nguyên liệu</Text>
            <Text style={styles.subtitle}>Chụp ảnh hoặc tải nhiều ảnh lên trước khi phân tích</Text>
          </View>

          <Pressable onPress={clearImages} style={styles.headerAction}>
            <Text style={styles.headerActionText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.actionGrid}>
            <Pressable style={[styles.actionCard, styles.cameraCard]} onPress={openCamera}>
              <Text style={styles.actionIcon}>📸</Text>
              <Text style={styles.actionTitle}>Chụp ảnh</Text>
              <Text style={styles.actionDescription}>Chụp nhanh từng lần, ảnh sẽ được thêm vào danh sách</Text>
            </Pressable>

            <Pressable style={[styles.actionCard, styles.uploadCard]} onPress={pickImage}>
              <Text style={styles.actionIcon}>🖼️</Text>
              <Text style={styles.actionTitle}>Tải ảnh lên</Text>
              <Text style={styles.actionDescription}>Chọn một hoặc nhiều ảnh từ thư viện để phân tích</Text>
            </Pressable>
          </View>

          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>Ảnh đã thêm</Text>
            <Text style={styles.counter}>{images.length} ảnh</Text>
          </View>

          {images.length > 0 ? (
            <View style={styles.galleryCard}>
              <FlatList
                data={images}
                horizontal
                keyExtractor={(_, index) => `${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryList}
                renderItem={({ item, index }) => (
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: item }} style={styles.image} />
                    <Pressable style={styles.removeButton} onPress={() => removeImage(index)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                  </View>
                )}
              />

              <View style={styles.galleryActions}>
                <Pressable style={styles.secondaryButton} onPress={openCamera}>
                  <Text style={styles.secondaryButtonText}>+ Chụp thêm</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={pickImage}>
                  <Text style={styles.secondaryButtonText}>+ Tải thêm</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
                onPress={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.analyzeButtonText}>Phân tích nguyên liệu</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📷</Text>
              <Text style={styles.emptyStateTitle}>Chưa có ảnh nào</Text>
              <Text style={styles.emptyStateText}>Hãy dùng 1 trong 2 nút phía trên để bắt đầu.</Text>
            </View>
          )}

          <AnalysisResult
            isLoading={isLoading}
            resultData={resultData}
            onUpdateResult={setResultData}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f3ea',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f3ea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#211f1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  headerActionText: {
    fontSize: 20,
    color: '#1f1f1f',
    fontWeight: '800',
  },
  headerTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6d655c',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#211f1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cameraCard: {
    backgroundColor: '#dff3ea',
  },
  uploadCard: {
    backgroundColor: '#f7e8d0',
  },
  actionIcon: {
    fontSize: 30,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    marginTop: 8,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4b4944',
    marginTop: 8,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  counter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7a6f61',
  },
  galleryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#211f1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  galleryList: {
    gap: 12,
    paddingBottom: 12,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: -1,
  },
  galleryActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  analyzeButton: {
    marginTop: 12,
    backgroundColor: '#28a745',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#211f1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  emptyStateEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6d655c',
    textAlign: 'center',
  },
});