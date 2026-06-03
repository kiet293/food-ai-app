import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Pressable,
} from 'react-native';
import { AIAnalysisResult } from '../../services/aiService';
import { deleteRecipe, getSavedRecipes } from '../../services/aiService';

interface SavedRecipe extends AIAnalysisResult {
  id: string;
  savedAt: string;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';

  let date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      // Nếu năm chỉ có 2 chữ số → cộng 2000
      if (year < 100) year += 2000;
      date = new Date(year, month, day);
    }
  }

  if (isNaN(date.getTime())) return dateStr; // fallback: trả về chuỗi gốc

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function NotebookScreen() {
  const [savedList, setSavedList] = useState<SavedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);

  const loadData = async () => {
    const data = await getSavedRecipes();
    setSavedList(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa công thức "${name}" khỏi sổ tay không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteRecipe(id);
            loadData();
            if (selectedRecipe?.id === id) setSelectedRecipe(null);
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: SavedRecipe; index: number }) => {
    const accentColors = ['#2ecc71', '#e67e22', '#e74c3c', '#3498db', '#9b59b6'];
    const accent = accentColors[index % accentColors.length];

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: accent }]}
        onPress={() => setSelectedRecipe(item)}
        onLongPress={() => confirmDelete(item.id, item.recipeName)}
        activeOpacity={0.75}
      >
        {/* ✅ Ngày nằm riêng trên 1 dòng, không tranh chỗ với tên */}
        <View style={styles.cardTopRow}>
          <View style={[styles.accentDot, { backgroundColor: accent }]} />
          <Text style={styles.dateText}>📅 {formatDate(item.savedAt)}</Text>
        </View>

        <Text style={styles.recipeName}>{item.recipeName}</Text>

        <Text style={styles.ingredientsSummary} numberOfLines={1}>
          🛒 {item.ingredients.map((i) => i.name).join(' · ')}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.hintText}>Chạm để xem  •  Nhấn giữ để xóa</Text>
          <Text style={styles.arrowIcon}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sổ tay ẩm thực 📖</Text>
        <Text style={styles.headerSub}>Tổng hợp {savedList.length} công thức đã lưu của bạn</Text>
      </View>

      {savedList.length > 0 ? (
        <FlatList
          data={savedList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>Chưa có công thức nào</Text>
          <Text style={styles.emptyText}>
            Hãy chụp ảnh nguyên liệu ở trang Home để bắt đầu lưu công thức nhé!
          </Text>
        </View>
      )}

      {/* Modal chi tiết */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedRecipe !== null}
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRecipe(null)} />
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <>
                {/* Handle bar */}
                <View style={styles.handleBar} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecipe.recipeName}</Text>
                  {/* ✅ Ngày trong modal cũng được format đúng */}
                  <Text style={styles.modalDate}>
                    📅 Lưu ngày: {formatDate(selectedRecipe.savedAt)}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedRecipe.imageUrl && (
                    <Image
                      source={{ uri: selectedRecipe.imageUrl }}
                      style={styles.recipeImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>🛒 Nguyên liệu</Text>
                    {selectedRecipe.ingredients.map((item, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <View style={styles.ingredientDot} />
                        <Text style={styles.itemText}>
                          {item.name}
                          <Text style={styles.probabilityText}> ({item.probability}%)</Text>
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>🍳 Cách làm</Text>
                    {selectedRecipe.instructions.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ height: 20 }} />
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedRecipe(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeButtonText}>Đóng</Text>
                </TouchableOpacity>
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
    backgroundColor: '#f0f4f0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f0f4f0',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2ecc71',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },

  // ── List ────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ── Card ────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
  },
  // ✅ Dòng trên: dấu chấm accent + ngày (không có tên → không bị đẩy)
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#8aab8a',
    fontWeight: '500',
  },
  // Tên món ở dòng riêng → không bao giờ bị cắt
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a1a',
    lineHeight: 22,
    marginBottom: 6,
  },
  ingredientsSummary: {
    fontSize: 13,
    color: '#6b8f6b',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f4f0',
    paddingTop: 8,
    marginTop: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#adc6ad',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#adc6ad',
    fontWeight: '300',
  },

  // ── Empty ───────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3a5a3a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8aab8a',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Modal ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dde8dd',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0e8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a3a1a',
    textAlign: 'center',
    lineHeight: 28,
  },
  modalDate: {
    fontSize: 12,
    color: '#8aab8a',
    marginTop: 6,
  },
  modalBody: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#e8f0e8',
  },
  sectionBox: {
    backgroundColor: '#f7fbf7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a1a',
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71',
    marginRight: 10,
  },
  itemText: {
    fontSize: 15,
    color: '#2d4a2d',
    flex: 1,
  },
  probabilityText: {
    color: '#8aab8a',
    fontSize: 13,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2d4a2d',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#1a3a1a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});