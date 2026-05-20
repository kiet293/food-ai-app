import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { getPopularRecipes, saveRecipeToDatabase, PopularRecipe, AIAnalysisResult } from '../../services/aiService';

export default function PopularScreen() {
  const [popularList, setPopularList] = useState<PopularRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<PopularRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tải dữ liệu top món ăn
  const loadData = async () => {
    setIsLoading(true);
    const data = await getPopularRecipes();
    setPopularList(data);
    setIsLoading(false);
  };

  // Cập nhật khi chuyển Tab sang Popular
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Hàm xử lý lưu món từ bảng xếp hạng vào sổ tay cá nhân
  const handleSaveRecipe = async (recipe: PopularRecipe) => {
    setIsSaving(true);
    try {
      const recipeData: AIAnalysisResult = {
        recipeName: recipe.recipeName,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        imageUrl: recipe.imageUrl
      };

      await saveRecipeToDatabase(recipeData);
      Alert.alert("Thành công! 🎉", `Đã thêm "${recipe.recipeName}" vào Sổ tay của bạn.`);
      // Tải lại danh sách để cập nhật số lượt thích vừa được tăng lên ở backend
      loadData();
    } catch (error: any) {
      Alert.alert("Thông báo", error.message || "Không thể lưu lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };

  // Hàm trả về icon huy chương tương ứng với thứ hạng
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Text style={styles.medal}>🥇</Text>;
      case 1:
        return <Text style={styles.medal}>🥈</Text>;
      case 2:
        return <Text style={styles.medal}>🥉</Text>;
      default:
        return (
          <View style={styles.rankNumberContainer}>
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          </View>
        );
    }
  };

  // Render từng Card món ăn phổ biến
  const renderItem = ({ item, index }: { item: PopularRecipe; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedRecipe(item)}
      activeOpacity={0.8}
    >
      {/* Ảnh món ăn bên trái */}
      <Image
        source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500' }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* Thông tin ở giữa */}
      <View style={styles.cardDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.recipeName} numberOfLines={1}>
            {item.recipeName}
          </Text>
        </View>

        {/* Chỉ số thống kê */}
        <View style={styles.statsRow}>
          <View style={styles.statTagScan}>
            <Text style={styles.statText}>🔥 {item.scanCount} gợi ý</Text>
          </View>
          <View style={styles.statTagSave}>
            <Text style={styles.statText}>❤️ {item.saveCount} thích</Text>
          </View>
        </View>
      </View>

      {/* Huy chương thứ hạng bên phải */}
      <View style={styles.badgeContainer}>
        {getRankBadge(index)}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Món Ngon Xu Hướng 🔥</Text>
        <Text style={styles.headerSubtitle}>Tổng hợp 10 món ăn được yêu thích nhất hệ thống</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4757" />
          <Text style={styles.loadingText}>Đang cập nhật bảng xếp hạng...</Text>
        </View>
      ) : popularList.length > 0 ? (
        <FlatList
          data={popularList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={loadData}
          refreshing={isLoading}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có dữ liệu xu hướng. Hãy bắt đầu quét và tạo công thức nhé! 🍳</Text>
        </View>
      )}

      {/* Modal chi tiết món ăn xu hướng */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedRecipe !== null}
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecipe.recipeName}</Text>
                  <View style={styles.modalStatsRow}>
                    <Text style={styles.modalStatText}>🔥 {selectedRecipe.scanCount} lượt gợi ý</Text>
                    <Text style={styles.modalStatText}>  •  </Text>
                    <Text style={styles.modalStatText}>❤️ {selectedRecipe.saveCount} lượt thích</Text>
                  </View>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedRecipe.imageUrl && (
                    <Image
                      source={{ uri: selectedRecipe.imageUrl }}
                      style={styles.recipeImage}
                      resizeMode="cover"
                    />
                  )}

                  <Text style={styles.sectionTitle}>🛒 Nguyên liệu chính:</Text>
                  {selectedRecipe.ingredients.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.name}
                    </Text>
                  ))}

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>🍳 Hướng dẫn thực hiện:</Text>
                  {selectedRecipe.instructions.map((step, index) => (
                    <Text key={index} style={styles.stepText}>{step}</Text>
                  ))}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => handleSaveRecipe(selectedRecipe)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>❤️ Lưu vào sổ tay của tôi</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setSelectedRecipe(null)}
                  >
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4757',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 25,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    // Soft shadow premium
    shadowColor: '#2f3542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f1f2f6',
  },
  cardDetails: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  nameRow: {
    marginBottom: 6,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3542',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTagScan: {
    backgroundColor: '#fff8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  statTagSave: {
    backgroundColor: '#fff0f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffccd3',
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#57606f',
  },
  badgeContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    fontSize: 28,
  },
  rankNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f2f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f3542',
    textAlign: 'center',
  },
  modalStatsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  modalStatText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  modalBody: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#e1e4e6',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    color: '#2f3542',
  },
  itemText: {
    fontSize: 15,
    color: '#57606f',
    marginBottom: 5,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f2f6',
    marginVertical: 12,
  },
  stepText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#57606f',
    marginBottom: 8,
  },
  modalActions: {
    marginTop: 15,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#ff4757',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#f1f2f6',
  },
  closeButtonText: {
    color: '#57606f',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
