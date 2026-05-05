import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AIAnalysisResult } from '../../services/aiService';
import { deleteRecipe, getSavedRecipes } from '../../services/aiService';

// Định nghĩa kiểu dữ liệu mở rộng cho món đã lưu (có thêm id và ngày lưu)
interface SavedRecipe extends AIAnalysisResult {
  id: string;
  savedAt: string;
}

export default function NotebookScreen() {
  const [savedList, setSavedList] = useState<SavedRecipe[]>([]);

  // Thêm State để lưu trữ món ăn đang được chọn để xem chi tiết
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);

  // Hàm lấy dữ liệu từ bộ nhớ máy
  const loadData = async () => {
    const data = await getSavedRecipes();
    setSavedList(data);
  };

  // Cập nhật lại danh sách mỗi khi người dùng mở Tab Notebook
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Xử lý khi nhấn giữ để xoá
  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có muốn xóa công thức "${name}" khỏi sổ tay không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa", style: "destructive", onPress: async () => {
            await deleteRecipe(id);
            loadData(); // Load lại danh sách sau khi xoá
            // Nếu đang mở khung chi tiết của món vừa xóa thì đóng lại luôn
            if (selectedRecipe?.id === id) setSelectedRecipe(null);
          }
        }
      ]
    );
  };

  // Giao diện cho từng dòng món ăn
  const renderItem = ({ item }: { item: SavedRecipe }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedRecipe(item)}
      onLongPress={() => confirmDelete(item.id, item.recipeName)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.recipeName}>🍲 {item.recipeName}</Text>
        <Text style={styles.dateText}>{item.savedAt}</Text>
      </View>

      <Text style={styles.ingredientsSummary} numberOfLines={1}>
        Nguyên liệu: {item.ingredients.map(i => i.name).join(', ')}
      </Text>

      <Text style={styles.hintText}>💡 Chạm để xem • Nhấn giữ để xóa</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Sổ tay ẩm thực 📖</Text>

      {savedList.length > 0 ? (
        <FlatList
          data={savedList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có công thức nào được lưu. Hãy chụp ảnh nguyên liệu ở trang Home nhé! 🍳</Text>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        // Modal chỉ hiện khi selectedRecipe có dữ liệu (không phải null)
        visible={selectedRecipe !== null}
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecipe.recipeName}</Text>
                  <Text style={styles.modalDate}>Lưu ngày: {selectedRecipe.savedAt}</Text>
                </View>

                {/* Dùng ScrollView để lỡ công thức dài thì vuốt cuộn được */}
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

                  <Text style={styles.sectionTitle}>🛒 Nguyên liệu:</Text>
                  {selectedRecipe.ingredients.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.name} ({item.probability}%)
                    </Text>
                  ))}

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>🍳 Cách làm:</Text>
                  {selectedRecipe.instructions.map((step, index) => (
                    <Text key={index} style={styles.stepText}>{step}</Text>
                  ))}

                </ScrollView>

                <View style={styles.closeButtonContainer}>
                  <Button title="Đóng" color="#636e72" onPress={() => setSelectedRecipe(null)} />
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    // Tạo bóng đổ cho iOS/Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#28a745', // Màu xanh tạo điểm nhấn
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  dateText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  ingredientsSummary: {
    fontSize: 14,
    color: '#636e72',
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 11,
    color: '#b2bec3',
    marginTop: 10,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Làm mờ màn hình phía sau
    justifyContent: 'flex-end', // Đẩy thẻ modal xuống dưới cùng
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%', // Chiếm 80% chiều cao màn hình
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: { marginBottom: 15, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#28a745', textAlign: 'center' },
  modalDate: { fontSize: 12, color: '#95a5a6', marginTop: 5 },
  modalBody: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 8, color: '#333' },
  itemText: { fontSize: 16, color: '#444', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  stepText: { fontSize: 16, lineHeight: 24, color: '#444', marginBottom: 10 },
  closeButtonContainer: { marginTop: 15, borderRadius: 8, overflow: 'hidden' }
});