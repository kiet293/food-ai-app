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
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AnalysisResult } from '@/components/ai-analysis/AnalysisResult';
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerAction} hitSlop={10}>
            <MaterialIcons name="arrow-back" size={24} color="#1a3a1a" />
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Thêm ảnh nguyên liệu</Text>
            <Text style={styles.subtitle}>Chụp ảnh hoặc chọn từ album của bạn</Text>
          </View>

          {images.length > 0 && (
            <Pressable onPress={clearImages} style={[styles.headerAction, styles.clearAction]} hitSlop={10}>
              <MaterialIcons name="delete-sweep" size={22} color="#ff4757" />
            </Pressable>
          )}
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Action Grid */}
          <View style={styles.actionGrid}>
            <Pressable style={[styles.actionCard, styles.cameraCard]} onPress={openCamera}>
              <View style={styles.iconCircleCamera}>
                <MaterialIcons name="photo-camera" size={32} color="#1a3a1a" />
              </View>
              <Text style={styles.actionTitle}>Chụp ảnh</Text>
              <Text style={styles.actionDescription}>Quét trực tiếp nguyên liệu thực tế trước mặt bạn</Text>
            </Pressable>

            <Pressable style={[styles.actionCard, styles.uploadCard]} onPress={pickImage}>
              <View style={styles.iconCircleUpload}>
                <MaterialIcons name="photo-library" size={32} color="#7d5010" />
              </View>
              <Text style={styles.actionTitle}>Tải ảnh lên</Text>
              <Text style={styles.actionDescription}>Chọn nhiều ảnh từ thư viện thiết bị của bạn</Text>
            </Pressable>
          </View>

          {/* Gallery Section */}
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
                    <Pressable style={styles.removeButton} onPress={() => removeImage(index)} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                )}
              />

              <View style={styles.galleryActions}>
                <TouchableOpacity style={styles.galleryActionButton} onPress={openCamera} activeOpacity={0.8}>
                  <MaterialIcons name="add-a-photo" size={18} color="#1a3a1a" style={styles.buttonIcon} />
                  <Text style={styles.galleryActionButtonText}>Chụp thêm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.galleryActionButton} onPress={pickImage} activeOpacity={0.8}>
                  <MaterialIcons name="add-photo-alternate" size={18} color="#1a3a1a" style={styles.buttonIcon} />
                  <Text style={styles.galleryActionButtonText}>Tải thêm</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
                onPress={handleAnalyze}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.analyzeButtonText}>Phân tích nguyên liệu 🍳</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="image-search" size={42} color="#adc6ad" />
              </View>
              <Text style={styles.emptyStateTitle}>Chưa có ảnh nguyên liệu</Text>
              <Text style={styles.emptyStateText}>
                Hãy dùng 1 trong 2 nút phía trên để chụp hoặc tải ảnh nguyên liệu lên nhé!
              </Text>
            </View>
          )}

          {/* Results section */}
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
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e2d8',
  },
  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  clearAction: {
    backgroundColor: '#fff0f2',
    borderWidth: 1,
    borderColor: '#ffccd3',
  },
  headerTextWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a3a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#8aab8a',
  },
  body: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 168,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraCard: {
    borderWidth: 1,
    borderColor: '#dff3ea',
    backgroundColor: '#f7fdfb',
  },
  uploadCard: {
    borderWidth: 1,
    borderColor: '#f7e8d0',
    backgroundColor: '#fdfbf7',
  },
  iconCircleCamera: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dff3ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUpload: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f7e8d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3a1a',
    marginTop: 12,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6b8f6b',
    marginTop: 4,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3a1a',
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8aab8a',
  },
  galleryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  galleryList: {
    gap: 12,
    paddingBottom: 8,
  },
  imageWrap: {
    position: 'relative',
    marginRight: 4,
    marginTop: 6,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#f0f4f0',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  galleryActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  galleryActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dde8dd',
  },
  galleryActionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a3a1a',
  },
  buttonIcon: {
    marginRight: 6,
  },
  analyzeButton: {
    marginTop: 16,
    backgroundColor: '#2ecc71',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f0f4f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a3a1a',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8aab8a',
    textAlign: 'center',
  },
});