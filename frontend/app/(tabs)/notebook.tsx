import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  updateCollection,
  deleteCollection,
  removeRecipeFromCollection,
  CollectionFolder,
  getCollectionDetail,
  getAllRecipesInCollections,
} from '../../services/collection/collectionService';

const { width } = Dimensions.get('window');
const COLLECTION_CARD_WIDTH = (width - 44) / 2;

const COLORS = {
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  mutedSurface: '#F3F7F4',
  primaryText: '#1A3A1A',
  secondaryText: '#64748B',
  accent: '#28A745',
  accentSoft: '#E8F5E9',
  border: '#E8F0E8',
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
  const [editingCollection, setEditingCollection] = useState<CollectionFolder | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [isSelectingRecipes, setIsSelectingRecipes] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [isRemovingSelected, setIsRemovingSelected] = useState(false);

  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();

  React.useEffect(() => {
    if (collectionId) {
      setSelectedCollectionFilter(String(collectionId));
    }
  }, [collectionId]);

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
    setIsSelectingRecipes(false);
    setSelectedRecipeIds([]);
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

  const openRenameCollectionModal = (collection: CollectionFolder) => {
    setEditingCollection(collection);
    setEditingName(collection.name);
  };

  const handleSaveRenameCollection = async () => {
    if (!editingCollection) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      Alert.alert('Lỗi', 'Tên bộ sưu tập không được để trống');
      return;
    }
    setIsSavingRename(true);
    try {
      const updated = await updateCollection(editingCollection.id, trimmed);
      if (updated) {
        setCollections((prev) =>
          prev.map((col) => (col.id === editingCollection.id ? { ...col, name: updated.name } : col))
        );
      }
      setEditingCollection(null);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đổi tên bộ sưu tập');
    } finally {
      setIsSavingRename(false);
    }
  };

  const handleCollectionOptions = (collection: CollectionFolder) => {
    Alert.alert(
      `Bộ sưu tập “${collection.name}”`,
      'Chọn thao tác bạn muốn thực hiện:',
      [
        {
          text: 'Đổi tên bộ sưu tập',
          onPress: () => openRenameCollectionModal(collection),
        },
        {
          text: 'Xóa bộ sưu tập',
          style: 'destructive',
          onPress: () => confirmDeleteCollection(collection.id, collection.name),
        },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const toggleSelectRecipe = (recipeId: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  };

  const handleConfirmDeleteSelectedRecipes = () => {
    if (selectedRecipeIds.length === 0) return;

    const count = selectedRecipeIds.length;
    const isInCollection = !!selectedCollectionFilter && !!selectedCollection;

    Alert.alert(
      isInCollection ? 'Xóa khỏi bộ sưu tập' : 'Xóa công thức',
      isInCollection
        ? `Bạn có muốn xóa ${count} công thức đã chọn khỏi bộ sưu tập “${selectedCollection.name}” không?`
        : `Bạn có muốn xóa ${count} công thức đã chọn khỏi Sổ tay không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsRemovingSelected(true);
            try {
              if (isInCollection && selectedCollectionFilter) {
                await Promise.all(
                  selectedRecipeIds.map((rid) => removeRecipeFromCollection(selectedCollectionFilter, rid))
                );
                setDisplayedRecipes((prev) => prev.filter((r) => !selectedRecipeIds.includes(r.id)));
                setCollections((prev) =>
                  prev.map((col) =>
                    col.id === selectedCollectionFilter
                      ? { ...col, recipeCount: Math.max(0, (col.recipeCount || count) - count) }
                      : col
                  )
                );
                const allRecipes = await getAllRecipesInCollections();
                setSavedList(
                  allRecipes.map((r: any) => ({
                    id: r.id.toString(),
                    recipeName: r.recipe_name || r.title || 'Công thức',
                    imageUrl: r.image_url || r.image || '',
                    savedAt: r.created_at || new Date().toISOString(),
                  }))
                );
              } else {
                await Promise.all(selectedRecipeIds.map((rid) => deleteRecipe(rid)));
                await loadData();
              }
              setSelectedRecipeIds([]);
              setIsSelectingRecipes(false);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa các công thức đã chọn');
            } finally {
              setIsRemovingSelected(false);
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
          <View style={styles.recipeCountBadge}>
            <Text style={styles.recipeCountText}>{collections.length}</Text>
          </View>
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
              const isEmpty = (collection.recipeCount || 0) === 0;
              return (
                <TouchableOpacity
                  key={collection.id}
                  style={[
                    styles.collectionCard,
                    isEmpty && styles.collectionCardEmpty,
                    isSelected && styles.collectionCardActive,
                  ]}
                  onPress={() => setSelectedCollectionFilter(isSelected ? null : collection.id)}
                  onLongPress={() => handleCollectionOptions(collection)}
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityLabel={`Bộ sưu tập ${collection.name}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {isEmpty ? (
                    <View style={styles.emptyCardInner}>
                      <View style={styles.emptyCardTopRow}>
                        <View style={styles.collectionIconEmpty}>
                          <Ionicons
                            name={isSelected ? 'folder-open' : 'folder-open-outline'}
                            size={15}
                            color={COLORS.accent}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.emptyCardPlusBadge}
                          onPress={() => handleCollectionOptions(collection)}
                          hitSlop={8}
                        >
                          <Ionicons name="ellipsis-horizontal" size={14} color={COLORS.accent} />
                        </TouchableOpacity>
                      </View>
                      <View>
                        <Text style={styles.collectionNameEmpty} numberOfLines={1}>
                          {collection.name}
                        </Text>
                        <Text style={styles.collectionSubEmpty} numberOfLines={1}>
                          Thêm công thức đầu tiên
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Image source={{ uri: collection.coverImage }} style={styles.collectionImage} />
                      <View style={styles.collectionOverlay} />
                      <View style={styles.collectionIcon}>
                        <Ionicons name={isSelected ? 'folder-open' : 'folder-open-outline'} size={15} color={COLORS.white} />
                      </View>
                      <TouchableOpacity
                        style={styles.collectionMenuBtn}
                        onPress={() => handleCollectionOptions(collection)}
                        hitSlop={8}
                      >
                        <Ionicons name="ellipsis-horizontal" size={15} color={COLORS.white} />
                      </TouchableOpacity>
                      <View style={styles.collectionContent}>
                        <Text style={styles.collectionName} numberOfLines={1}>{collection.name}</Text>
                        <Text style={styles.collectionSub}>{collection.recipeCount} công thức</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={[styles.sectionHeader, styles.recipeSectionHeader]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.sectionTitle}>Công thức đã lưu</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedCollection ? `Đang xem bộ sưu tập “${selectedCollection.name}”` : 'Những món bạn muốn nấu lại'}
            </Text>
          </View>
          <View style={styles.recipeHeaderRight}>
            {displayedRecipes.length > 0 && (
              <TouchableOpacity
                style={[styles.selectModeBtn, isSelectingRecipes && styles.selectModeBtnActive]}
                onPress={() => {
                  setIsSelectingRecipes((prev) => !prev);
                  setSelectedRecipeIds([]);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectModeBtnText, isSelectingRecipes && styles.selectModeBtnTextActive]}>
                  {isSelectingRecipes ? 'Hủy' : 'Chọn xóa'}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.recipeCountBadge}>
              <Text style={styles.recipeCountText}>{displayedRecipes.length}</Text>
            </View>
          </View>
        </View>

        {selectedCollection && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilterCopy}>
              <Ionicons name="funnel-outline" size={15} color={COLORS.accent} />
              <Text style={styles.activeFilterText} numberOfLines={1}>{selectedCollection.name}</Text>
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

        {isSelectingRecipes && (
          <View style={styles.selectionActionBar}>
            <Text style={styles.selectionCountText}>
              {selectedRecipeIds.length > 0
                ? `Đã chọn ${selectedRecipeIds.length} món`
                : 'Chạm vào món ăn bạn muốn xóa'}
            </Text>
            <TouchableOpacity
              style={[
                styles.confirmDeleteSelectedBtn,
                (selectedRecipeIds.length === 0 || isRemovingSelected) && { opacity: 0.45 },
              ]}
              disabled={selectedRecipeIds.length === 0 || isRemovingSelected}
              onPress={handleConfirmDeleteSelectedRecipes}
              activeOpacity={0.85}
            >
              {isRemovingSelected ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={15} color="#fff" />
                  <Text style={styles.confirmDeleteSelectedText}>
                    Xóa{selectedRecipeIds.length > 0 ? ` (${selectedRecipeIds.length})` : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isLoadingDetail ? (
          <ActivityIndicator size="small" color={COLORS.accent} style={{ margin: 20 }} />
        ) : displayedRecipes.length > 0 ? (
          <View style={styles.gridContainer}>
            {displayedRecipes.map((item) => {
              const isItemSelected = selectedRecipeIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={`grid-item-${item.id}`}
                  style={[
                    styles.gridItem,
                    isSelectingRecipes && isItemSelected && styles.gridItemSelected,
                  ]}
                  onPress={() => {
                    if (isSelectingRecipes) {
                      toggleSelectRecipe(item.id);
                    } else {
                      router.push({ pathname: "/explore-detail/[id]", params: { id: item.id } });
                    }
                  }}
                  onLongPress={() => {
                    if (!isSelectingRecipes) {
                      setIsSelectingRecipes(true);
                      setSelectedRecipeIds([item.id]);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  {isSelectingRecipes && (
                    <View
                      style={[
                        styles.selectionCheckBadge,
                        isItemSelected && styles.selectionCheckBadgeActive,
                      ]}
                    >
                      {isItemSelected && <Ionicons name="checkmark" size={15} color="#fff" />}
                    </View>
                  )}
                  <View style={styles.gridTitleWrap}>
                    <Text style={styles.gridTitle} numberOfLines={2}>{item.recipeName}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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

      {/* MODAL ĐỔI TÊN BỘ SƯU TẬP */}
      <Modal
        visible={editingCollection !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setEditingCollection(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditingCollection(null)} />
          <KeyboardAvoidingView
            style={{ justifyContent: 'flex-end' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.renameModalCard}>
              <View style={styles.handleBar} />
              <View style={styles.renameHeaderRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.renameModalTitle}>Đổi tên bộ sưu tập</Text>
                  <Text style={styles.renameModalSub}>Nhập tên mới cho bộ sưu tập của bạn.</Text>
                </View>
                <TouchableOpacity
                  style={styles.renameCloseBtn}
                  onPress={() => setEditingCollection(null)}
                >
                  <Ionicons name="close" size={20} color={COLORS.primaryText} />
                </TouchableOpacity>
              </View>

              <Text style={styles.renameInputLabel}>Tên bộ sưu tập</Text>
              <TextInput
                style={styles.renameInput}
                placeholder="Nhập tên bộ sưu tập..."
                placeholderTextColor="#94a3b8"
                value={editingName}
                onChangeText={setEditingName}
                maxLength={40}
                autoFocus
              />

              <View style={styles.renameActionsRow}>
                <TouchableOpacity
                  style={styles.renameCancelBtn}
                  onPress={() => setEditingCollection(null)}
                >
                  <Text style={styles.renameCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.renameSaveBtn, (!editingName.trim() || isSavingRename) && { opacity: 0.5 }]}
                  disabled={!editingName.trim() || isSavingRename}
                  onPress={handleSaveRenameCollection}
                >
                  {isSavingRename ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.renameSaveText}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
    top: 18,
    left: 16,
    right: 16,
    bottom: 16,
    justifyContent: 'space-between',
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    maxWidth: '88%',
  },
  bannerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerSub: {
    color: '#DFF3EA',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 7,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  collectionCardEmpty: {
    backgroundColor: '#F6FAF7',
    borderColor: '#D5E8D8',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyCardInner: {
    flex: 1,
    padding: 11,
    justifyContent: 'space-between',
  },
  emptyCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionIconEmpty: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#E3F3E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardPlusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F3E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionNameEmpty: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  collectionSubEmpty: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
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
  collectionMenuBtn: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
  recipeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectModeBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectModeBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  selectModeBtnText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  selectModeBtnTextActive: {
    color: COLORS.danger,
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
    flexShrink: 1,
  },
  clearFilterText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  selectionActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  selectionCountText: {
    color: '#9B2C2C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  confirmDeleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  confirmDeleteSelectedText: {
    color: '#fff',
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
    position: 'relative',
  },
  gridItemSelected: {
    borderColor: COLORS.danger,
    borderWidth: 2,
  },
  selectionCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  selectionCheckBadgeActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
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
  renameModalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  renameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  renameModalTitle: {
    color: COLORS.primaryText,
    fontSize: 21,
    fontWeight: '800',
  },
  renameModalSub: {
    color: COLORS.secondaryText,
    fontSize: 13,
    marginTop: 4,
  },
  renameCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.mutedSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameInputLabel: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  renameInput: {
    minHeight: 50,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: COLORS.primaryText,
    fontSize: 15,
    marginBottom: 22,
  },
  renameActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.mutedSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameCancelText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  renameSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameSaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
