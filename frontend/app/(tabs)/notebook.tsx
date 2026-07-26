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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIAnalysisResult, deleteRecipe, getSavedRecipes } from '../../services/aiService';
import { CreateCollectionModal } from '../../components/collections/CreateCollectionModal';

const { width } = Dimensions.get('window');
const COLLECTION_CARD_WIDTH = (width - 44) / 2;

interface SavedRecipe extends AIAnalysisResult {
  id: string;
  savedAt: string;
}

interface CollectionFolder {
  id: string;
  name: string;
  recipeCount: number;
  coverImage: string;
}

const INITIAL_COLLECTIONS: CollectionFolder[] = [
  {
    id: 'col-1',
    name: '15 PHÚT MỖI NGÀY',
    recipeCount: 5,
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'col-2',
    name: 'MEAL PREP TIỆN LỢI',
    recipeCount: 3,
    coverImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'col-3',
    name: 'MÓN CHAY HEALTHY',
    recipeCount: 4,
    coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'col-4',
    name: 'BÁNH NGỌT & DESSERT',
    recipeCount: 6,
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
  },
];

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  let date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      date = new Date(year, month, day);
    }
  }
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function NotebookScreen() {
  const [savedList, setSavedList] = useState<SavedRecipe[]>([]);
  const [collections, setCollections] = useState<CollectionFolder[]>(INITIAL_COLLECTIONS);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string | null>(null);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);

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

  const handleCreateCollection = (name: string) => {
    const newCol: CollectionFolder = {
      id: `col-${Date.now()}`,
      name: name.toUpperCase(),
      recipeCount: 0,
      coverImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80',
    };
    setCollections([newCol, ...collections]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top Header Row Pepper UI */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.infoBtn}>
          <Ionicons name="information-circle-outline" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>COLLECTIONS.</Text>
        <TouchableOpacity style={styles.infoBtn} onPress={() => setIsCreateCollectionOpen(true)}>
          <Ionicons name="add" size={26} color="#28a745" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* ALL SAVED. Pill Card */}
        <TouchableOpacity
          style={[styles.allSavedCard, !selectedCollectionFilter && styles.allSavedCardActive]}
          onPress={() => setSelectedCollectionFilter(null)}
          activeOpacity={0.8}
        >
          <View style={styles.bookmarkRing}>
            <Ionicons name="bookmark-outline" size={24} color="#28a745" />
          </View>
          <View style={styles.allSavedTextWrap}>
            <Text style={styles.allSavedTitle}>ALL SAVED.</Text>
            <Text style={styles.allSavedSub}>
              {savedList.length} món đã lưu • 0 món đã nấu
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>

        {/* Organize Recipes Hero Banner */}
        <TouchableOpacity
          style={styles.organizeBanner}
          onPress={() => setIsCreateCollectionOpen(true)}
          activeOpacity={0.9}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.bannerImg}
          />
          <View style={styles.starBadge}>
            <Ionicons name="star" size={16} color="#fff" />
          </View>
          <View style={styles.bannerCenterPill}>
            <Text style={styles.bannerPillTitle}>ORGANIZE RECIPES.</Text>
            <Text style={styles.bannerPillSub}>Bấm để tạo bộ sưu tập mới (+)</Text>
          </View>
        </TouchableOpacity>

        {/* User Collections Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BỘ SƯU TẬP THEO NHÓM.</Text>
        </View>
        <View style={styles.collectionsGrid}>
          {collections.map((col) => {
            const isSelected = selectedCollectionFilter === col.id;
            return (
              <TouchableOpacity
                key={col.id}
                style={[styles.colGridCard, isSelected && styles.colGridCardActive]}
                onPress={() =>
                  setSelectedCollectionFilter(isSelected ? null : col.id)
                }
              >
                <Image source={{ uri: col.coverImage }} style={styles.colCoverImg} />
                <View style={styles.colOverlay} />
                <View style={styles.colStarBadge}>
                  <Ionicons name="star-outline" size={14} color="#fff" />
                </View>
                <View style={styles.colContent}>
                  <Text style={styles.colName}>{col.name}</Text>
                  <Text style={styles.colSub}>{col.recipeCount} recipes</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Saved Recipes List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCollectionFilter
              ? `CÔNG THỨC TRONG NÓM`
              : `TẤT CẢ CÔNG THỨC ĐÃ LƯU.`}
          </Text>
        </View>

        {savedList.length > 0 ? (
          <View style={styles.recipesList}>
            {savedList.map((item, index) => {
              const accentColors = ['#28a745', '#3498db', '#e67e22', '#9b59b6'];
              const accent = accentColors[index % accentColors.length];

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.recipeCard, { borderLeftColor: accent }]}
                  onPress={() => setSelectedRecipe(item)}
                  onLongPress={() => confirmDelete(item.id, item.recipeName)}
                  activeOpacity={0.8}
                >
                  <View style={styles.recipeTopRow}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={styles.recipeDate}>📅 {formatDate(item.savedAt)}</Text>
                  </View>

                  <Text style={styles.recipeName}>{item.recipeName}</Text>

                  <Text style={styles.ingredientsSummary} numberOfLines={1}>
                    🛒 {item.ingredients.map((i) => i.name).join(' · ')}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.hintText}>Chạm để xem  •  Nhấn giữ để xóa</Text>
                    <Ionicons name="chevron-forward" size={16} color="#aaa" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🍳</Text>
            <Text style={styles.emptyTitle}>Chưa có công thức nào</Text>
            <Text style={styles.emptySub}>
              Hãy quét ảnh hoặc tìm kiếm ở trang Khám Phá để bắt đầu lưu công thức nhé!
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal create collection */}
      <CreateCollectionModal
        visible={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
        onCreateCollection={handleCreateCollection}
      />

      {/* Recipe Detail Modal */}
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
                <View style={styles.handleBar} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecipe.recipeName}</Text>
                  <Text style={styles.modalDate}>
                    📅 Lưu ngày: {formatDate(selectedRecipe.savedAt)}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedRecipe.imageUrl && (
                    <Image
                      source={{ uri: selectedRecipe.imageUrl }}
                      style={styles.recipeHeroImg}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitleModal}>🛒 Nguyên liệu</Text>
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
                    <Text style={styles.sectionTitleModal}>🍳 Cách làm</Text>
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
    backgroundColor: '#fff',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 1,
  },
  allSavedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#eef0f2',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  allSavedCardActive: {
    borderColor: '#28a745',
    backgroundColor: '#f8fdf9',
  },
  bookmarkRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  allSavedTextWrap: {
    flex: 1,
  },
  allSavedTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 0.5,
  },
  allSavedSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  organizeBanner: {
    height: 140,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  starBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffc107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerCenterPill: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  bannerPillTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerPillSub: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 0.5,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  colGridCard: {
    width: COLLECTION_CARD_WIDTH,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  colGridCardActive: {
    borderWidth: 2,
    borderColor: '#28a745',
  },
  colCoverImg: {
    width: '100%',
    height: '100%',
  },
  colOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  colStarBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  colContent: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  colName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  colSub: {
    color: '#e0e0e0',
    fontSize: 11,
    marginTop: 2,
  },
  recipesList: {
    paddingHorizontal: 16,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  recipeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  recipeDate: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  ingredientsSummary: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 8,
  },
  hintText: {
    fontSize: 11,
    color: '#aaa',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  emptySub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  modalBody: {
    flex: 1,
  },
  recipeHeroImg: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 14,
  },
  sectionBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitleModal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#444',
  },
  probabilityText: {
    color: '#888',
    fontSize: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#28a745',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});