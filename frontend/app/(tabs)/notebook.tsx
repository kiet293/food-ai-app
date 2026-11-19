import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIAnalysisResult } from '../../services/ai/aiService';
import { deleteRecipe, getSavedRecipes } from '../../services/recipe/recipeService';
import { CreateCollectionModal } from '../../components/collections/CreateCollectionModal';
import {
  getCollections,
  createCollection,
  deleteCollection,
  CollectionFolder,
  getCollectionDetail,
  getAllRecipesInCollections,
} from '../../services/collection/collectionService';

const { width } = Dimensions.get('window');
const COLLECTION_CARD_WIDTH = (width - 44) / 2;

const COLORS = {
  canvas: '#F6F3EA',
  surface: '#FFFFFF',
  mutedSurface: '#F0F4F0',
  primaryText: '#1A3A1A',
  secondaryText: '#6B8F6B',
  accent: '#2ECC71',
  accentSoft: '#DFF3EA',
  border: '#E8E2D8',
  softBorder: '#E4ECE5',
  danger: '#D95C5C',
  white: '#FFFFFF',
};

interface SavedRecipe extends AIAnalysisResult {
  id: string;
  savedAt: string;
}

// Dữ liệu bộ sưu tập sẽ được tải trực tiếp từ Backend qua collectionService

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
  const [savedList, setSavedList] = useState<any[]>([]);
  const [collections, setCollections] = useState<CollectionFolder[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string | null>(null);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [displayedRecipes, setDisplayedRecipes] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoadingCollections(true);
    try {
      const [recipesData, collectionsData] = await Promise.all([
        getAllRecipesInCollections(),
        getCollections(),
      ]);
      const normalizedAll = recipesData.map((r: any) => ({
        id: r.id.toString(),
        recipeName: r.recipe_name || r.title || 'Công thức',
        imageUrl: r.image_url || r.image || '',
        savedAt: r.created_at || new Date().toISOString(),
      }));
      setSavedList(normalizedAll);
      setCollections(collectionsData);
    } catch (error) {
      console.error('❌ Lỗi tải dữ liệu sổ tay:', error);
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  React.useEffect(() => {
    if (selectedCollectionFilter) {
      const fetchDetail = async () => {
        setIsLoadingDetail(true);
        const detail = await getCollectionDetail(selectedCollectionFilter);
        if (detail && detail.recipes) {
          const normalized = detail.recipes.map((r: any) => ({
            id: r.id.toString(),
            recipeName: r.recipe_name || r.title || 'Công thức',
            imageUrl: r.image_url || r.image || '',
          }));
          setDisplayedRecipes(normalized);
        } else {
          setDisplayedRecipes([]);
        }
        setIsLoadingDetail(false);
      };
      fetchDetail();
    } else {
      setDisplayedRecipes(savedList);
    }
  }, [selectedCollectionFilter, savedList]);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa công thức “${name}” khỏi sổ tay không?`,
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

  const confirmDeleteCollection = (id: string, name: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa bộ sưu tập “${name}” không? Các món ăn trong nhóm này vẫn sẽ được giữ an toàn trong Sổ tay của bạn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(id);
              setCollections((prev) => prev.filter((col) => col.id !== id));
              if (selectedCollectionFilter === id) {
                setSelectedCollectionFilter(null);
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa bộ sưu tập');
            }
          },
        },
      ]
    );
  };

  const handleCreateCollection = async (name: string) => {
    try {
      const newCol = await createCollection(name);
      if (newCol) {
        setCollections((previous) => [newCol, ...previous]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo bộ sưu tập');
    }
  };

  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionFilter);
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <View>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>GÓC BẾP CỦA BẠN</Text>
          </View>
          <Text style={styles.headerTitle}>Sổ tay công thức</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.organizeBanner}
          onPress={() => setIsCreateCollectionOpen(true)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Tạo bộ sưu tập mới"
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85',
            }}
            style={styles.bannerImg}
            resizeMode="cover"
          />
          <View style={styles.bannerScrim} />
          <View style={styles.bannerBadge}>
            <Ionicons name="sparkles" size={14} color={COLORS.primaryText} />
            <Text style={styles.bannerBadgeText}>GỢI Ý</Text>
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Gom công thức theo cách của bạn</Text>
            <View style={styles.bannerActionRow}>
              <Text style={styles.bannerSub}>Tạo bộ sưu tập mới</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Bộ sưu tập</Text>
            <Text style={styles.sectionSubtitle}>Sắp xếp món ăn để tìm nhanh hơn</Text>
          </View>
          <Text style={styles.sectionCount}>{collections.length} nhóm</Text>
        </View>

        <View style={styles.collectionsGrid}>
          {collections.length === 0 && !loadingCollections ? (
            <TouchableOpacity
              style={styles.emptyCollectionContainer}
              onPress={() => setIsCreateCollectionOpen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.emptyCollectionIconWrap}>
                <Ionicons name="folder-open-outline" size={28} color={COLORS.secondaryText} />
              </View>
              <Text style={styles.emptyCollectionTitle}>Chưa có bộ sưu tập nào</Text>
              <Text style={styles.emptyCollectionSub}>
                Hãy nhấn vào đây để tạo bộ sưu tập đầu tiên giúp phân loại món ăn yêu thích nhanh gọn hơn nhé!
              </Text>
            </TouchableOpacity>
          ) : (
            collections.map((collection) => {
              const isSelected = selectedCollectionFilter === collection.id;
              return (
                <TouchableOpacity
                  key={collection.id}
                  style={[styles.collectionCard, isSelected && styles.collectionCardActive]}
                  onPress={() => setSelectedCollectionFilter(isSelected ? null : collection.id)}
                  onLongPress={() => confirmDeleteCollection(collection.id, collection.name)}
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityLabel={`Bộ sưu tập ${collection.name}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Image source={{ uri: collection.coverImage }} style={styles.collectionImage} />
                  <View style={styles.collectionOverlay} />
                  <View style={styles.collectionIcon}>
                    <Ionicons name={isSelected ? 'folder-open' : 'folder-open-outline'} size={15} color={COLORS.white} />
                  </View>
                  <View style={styles.collectionContent}>
                    <Text style={styles.collectionName} numberOfLines={1}>{collection.name}</Text>
                    <Text style={styles.collectionSub}>{collection.recipeCount} công thức</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={[styles.sectionHeader, styles.recipeSectionHeader]}>
          <View>
            <Text style={styles.sectionTitle}>Công thức đã lưu</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedCollection ? `Đang xem nhóm “${selectedCollection.name}”` : 'Những món bạn muốn nấu lại'}
            </Text>
          </View>
          <View style={styles.recipeCountBadge}>
            <Text style={styles.recipeCountText}>{displayedRecipes.length}</Text>
          </View>
        </View>

        {selectedCollection && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilterCopy}>
              <Ionicons name="funnel-outline" size={15} color={COLORS.accent} />
              <Text style={styles.activeFilterText}>{selectedCollection.name}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedCollectionFilter(null)}
              accessibilityRole="button"
              accessibilityLabel="Bỏ bộ lọc bộ sưu tập"
              hitSlop={8}
            >
              <Text style={styles.clearFilterText}>Bỏ chọn</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoadingDetail ? (
          <ActivityIndicator size="small" color={COLORS.accent} style={{ margin: 20 }} />
        ) : displayedRecipes.length > 0 ? (
          <View style={styles.gridContainer}>
            {displayedRecipes.map((item) => (
              <TouchableOpacity
                key={`grid-item-${item.id}`}
                style={styles.gridItem}
                onPress={() => router.push({ pathname: "/explore-detail/[id]", params: { id: item.id } })}
                onLongPress={() => confirmDelete(item.id, item.recipeName)}
                activeOpacity={0.85}
              >
                <Image 
                  source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' }} 
                  style={styles.gridImage} 
                  resizeMode="cover" 
                />
                <View style={styles.gridTitleWrap}>
                  <Text style={styles.gridTitle} numberOfLines={2}>{item.recipeName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="restaurant-outline" size={29} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có công thức nào</Text>
            <Text style={styles.emptySub}>
              Hãy quét ảnh hoặc tìm kiếm ở trang Khám phá để bắt đầu lưu công thức nhé.
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateCollectionModal
        visible={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
        onCreateCollection={handleCreateCollection}
      />

      <Modal
        animationType="slide"
        transparent
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
                  <View style={styles.modalDateRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.secondaryText} />
                    <Text style={styles.modalDate}>Lưu ngày {formatDate(selectedRecipe.savedAt)}</Text>
                  </View>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedRecipe.imageUrl && (
                    <Image source={{ uri: selectedRecipe.imageUrl }} style={styles.recipeHeroImg} resizeMode="cover" />
                  )}

                  <View style={styles.sectionBox}>
                    <View style={styles.modalSectionTitleRow}>
                      <View style={styles.modalSectionIcon}>
                        <Ionicons name="basket-outline" size={16} color={COLORS.accent} />
                      </View>
                      <Text style={styles.sectionTitleModal}>Nguyên liệu</Text>
                    </View>
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
                    <View style={styles.modalSectionTitleRow}>
                      <View style={styles.modalSectionIcon}>
                        <Ionicons name="list-outline" size={16} color={COLORS.accent} />
                      </View>
                      <Text style={styles.sectionTitleModal}>Cách làm</Text>
                    </View>
                    {selectedRecipe.instructions.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalBottomSpace} />
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedRecipe(null)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel="Đóng chi tiết công thức"
                >
                  <Text style={styles.closeButtonText}>Đóng lại</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 7,
  },
  eyebrow: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: COLORS.primaryText,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primaryText,
    shadowColor: COLORS.primaryText,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 44,
  },
  organizeBanner: {
    height: 164,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 25,
    backgroundColor: COLORS.primaryText,
  },
  bannerImg: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  bannerScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 35, 20, 0.58)',
    zIndex: 1,
  },
  bannerBadge: {
    position: 'absolute',
    zIndex: 2,
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CFF2DC',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  bannerBadgeText: {
    color: COLORS.primaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 5,
  },
  bannerContent: {
    position: 'absolute',
    zIndex: 2,
    left: 16,
    right: 16,
    bottom: 16,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    maxWidth: '88%',
  },
  bannerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  bannerSub: {
    color: '#DFF3EA',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 7,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipeSectionHeader: {
    alignItems: 'center',
    marginTop: 28,
  },
  sectionTitle: {
    color: COLORS.primaryText,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginTop: 3,
  },
  sectionCount: {
    color: COLORS.secondaryText,
    fontSize: 12,
    fontWeight: '700',
    paddingBottom: 2,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionCard: {
    width: COLLECTION_CARD_WIDTH,
    height: 120,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.primaryText,
  },
  collectionCardActive: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 26, 16, 0.42)',
  },
  collectionIcon: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(26, 58, 26, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionContent: {
    position: 'absolute',
    left: 11,
    right: 8,
    bottom: 10,
  },
  collectionName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  collectionSub: {
    color: '#DFF3EA',
    fontSize: 12,
    marginTop: 3,
  },
  emptyCollectionContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  emptyCollectionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.mutedSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCollectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginBottom: 6,
  },
  emptyCollectionSub: {
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  recipeCountBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeCountText: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  activeFilterCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeFilterText: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 7,
  },
  clearFilterText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gridItem: {
    width: (width - 44) / 2,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridImage: {
    width: '100%',
    height: (width - 44) / 2,
  },
  gridTitleWrap: {
    padding: 10,
  },
  gridTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 28,
    paddingVertical: 31,
    marginTop: 2,
  },
  emptyIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyTitle: {
    color: COLORS.primaryText,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 33, 20, 0.48)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    backgroundColor: COLORS.canvas,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: '82%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B7C5B8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.primaryText,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  modalDate: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginLeft: 5,
  },
  modalBody: {
    flex: 1,
    paddingTop: 14,
  },
  recipeHeroImg: {
    width: '100%',
    height: 176,
    borderRadius: 16,
    marginBottom: 13,
  },
  sectionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 11,
  },
  modalSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitleModal: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 9,
  },
  itemText: {
    color: '#405B43',
    fontSize: 14,
    lineHeight: 19,
  },
  probabilityText: {
    color: COLORS.secondaryText,
    fontSize: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    color: '#405B43',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalBottomSpace: {
    height: 18,
  },
  closeButton: {
    backgroundColor: COLORS.primaryText,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
