import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCollections,
  getCollectionsContainingRecipe,
  addRecipeToCollection,
  removeRecipeFromCollection,
  createCollection,
  CollectionFolder,
} from '../../services/collection/collectionService';
import { CreateCollectionModal } from './CreateCollectionModal';

const { height } = Dimensions.get('window');

interface SaveToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string | number;
  onSavedChange?: (isSavedInAny: boolean) => void;
}

export const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({
  visible,
  onClose,
  recipeId,
  onSavedChange,
}) => {
  const [collections, setCollections] = useState<CollectionFolder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!visible || !recipeId) return;
    setLoading(true);
    try {
      const [allCols, savedIds] = await Promise.all([
        getCollections(),
        getCollectionsContainingRecipe(recipeId),
      ]);
      setCollections(allCols);
      setSelectedIds(savedIds);
      if (onSavedChange) {
        onSavedChange(savedIds.length > 0);
      }
    } catch (error) {
      console.error('❌ Lỗi tải bộ sưu tập trong popup:', error);
    } finally {
      setLoading(false);
    }
  }, [visible, recipeId, onSavedChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleCollection = async (col: CollectionFolder) => {
    if (processingId) return;
    const isSelected = selectedIds.includes(col.id);
    const targetId = col.id;

    // Optimistic UI update
    const nextSelected = isSelected
      ? selectedIds.filter((id) => id !== targetId)
      : [...selectedIds, targetId];
    setSelectedIds(nextSelected);
    if (onSavedChange) {
      onSavedChange(nextSelected.length > 0);
    }

    setProcessingId(targetId);
    try {
      if (isSelected) {
        await removeRecipeFromCollection(targetId, recipeId.toString());
        setCollections((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, recipeCount: Math.max(0, c.recipeCount - 1) } : c))
        );
      } else {
        await addRecipeToCollection(targetId, recipeId.toString());
        setCollections((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, recipeCount: c.recipeCount + 1 } : c))
        );
      }
    } catch (error: any) {
      // Rollback nếu lỗi
      setSelectedIds(selectedIds);
      if (onSavedChange) {
        onSavedChange(selectedIds.length > 0);
      }
      Alert.alert('Lỗi', error.message || 'Không thể thao tác với bộ sưu tập');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateNewCollection = async (name: string) => {
    try {
      const newCol = await createCollection(name);
      if (newCol) {
        // Tự động thêm công thức vào bộ sưu tập mới tạo
        await addRecipeToCollection(newCol.id, recipeId.toString());
        const updatedCol = { ...newCol, recipeCount: 1 };
        setCollections((prev) => [updatedCol, ...prev]);
        const nextIds = [updatedCol.id, ...selectedIds];
        setSelectedIds(nextIds);
        if (onSavedChange) {
          onSavedChange(true);
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo bộ sưu tập mới');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Lưu vào...</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color="#1A1D1E" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#10B981" />
                </View>
              ) : collections.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Bạn chưa có bộ sưu tập nào.</Text>
                  <Text style={styles.emptySub}>Hãy tạo bộ sưu tập mới để lưu công thức này nhé!</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.listScroll}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                >
                  {collections.map((col) => {
                    const isSelected = selectedIds.includes(col.id);
                    const isBusy = processingId === col.id;

                    return (
                      <TouchableOpacity
                        key={col.id}
                        style={styles.colRow}
                        onPress={() => handleToggleCollection(col)}
                        activeOpacity={0.7}
                        disabled={isBusy}
                      >
                        {/* Folder Cover with YouTube style tab */}
                        <View style={styles.folderWrap}>
                          <View style={styles.folderTab} />
                          <Image source={{ uri: col.coverImage }} style={styles.folderImage} />
                        </View>

                        {/* Title & Subtitle */}
                        <View style={styles.colInfo}>
                          <Text style={styles.colName} numberOfLines={1}>{col.name}</Text>
                          <Text style={styles.colSub}>Riêng tư • {col.recipeCount} món</Text>
                        </View>

                        {/* Checkbox / Bookmark Icon */}
                        <View style={styles.colAction}>
                          {isBusy ? (
                            <ActivityIndicator size="small" color="#10B981" />
                          ) : (
                            <Ionicons
                              name={isSelected ? 'bookmark' : 'bookmark-outline'}
                              size={26}
                              color={isSelected ? '#1A1D1E' : '#6E777F'}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Footer Button: "+ Tạo bộ sưu tập mới" */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.createNewBtn}
                  onPress={() => setIsCreateModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={22} color="#1A1D1E" />
                  <Text style={styles.createNewBtnText}>Tạo bộ sưu tập mới</Text>
                </TouchableOpacity>
              </View>

              {/* Sub-Modal Create */}
              <CreateCollectionModal
                visible={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateCollection={(name) => {
                  setIsCreateModalOpen(false);
                  handleCreateNewCollection(name);
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.75,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D1E',
  },
  closeBtn: {
    padding: 2,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  listScroll: {
    maxHeight: height * 0.45,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  colRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  folderWrap: {
    width: 52,
    height: 40,
    marginRight: 14,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  folderTab: {
    position: 'absolute',
    top: 0,
    left: 6,
    width: 24,
    height: 6,
    backgroundColor: '#9CA3AF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  folderImage: {
    width: 52,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  colInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  colName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D1E',
    marginBottom: 3,
  },
  colSub: {
    fontSize: 13,
    color: '#6E777F',
  },
  colAction: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createNewBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D1E',
  },
});
