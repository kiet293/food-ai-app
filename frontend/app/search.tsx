import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { searchCommunityRecipes, RecipeSummary } from '../services/search/searchService';
import { searchRecipes, AIAnalysisResult } from '../services/ai/aiService';
import { saveRecipeToDatabase } from '../services/recipe/recipeService';

type SearchMode = 'community' | 'ai';

const AI_QUICK_SUGGESTIONS = [
  'Gợi ý bữa ăn ngon hôm nay',
  'Thịt gà, nấm hương',
  'Trứng, cà chua, hành',
  'Thịt bò, khoai tây',
  'Cá hồi, măng tây',
];

export default function SearchPage() {
  const router = useRouter();
  const { q, mode: initialMode } = useLocalSearchParams<{ q?: string; mode?: SearchMode }>();

  const [activeMode, setActiveMode] = useState<SearchMode>(
    initialMode === 'ai' ? 'ai' : 'community'
  );
  const [searchText, setSearchText] = useState(q || '');

  // Kết quả tìm kiếm riêng cho từng tab để khi chuyển tab không bị mất dữ liệu
  const [communityRecipes, setCommunityRecipes] = useState<RecipeSummary[]>([]);
  const [aiRecipes, setAiRecipes] = useState<AIAnalysisResult[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal hiển thị chi tiết
  const [selectedCommunityRecipe, setSelectedCommunityRecipe] = useState<RecipeSummary | null>(null);
  const [selectedAiRecipe, setSelectedAiRecipe] = useState<AIAnalysisResult | null>(null);

  // Tự động tìm kiếm nếu có param q hoặc mode truyền sang
  useEffect(() => {
    if (initialMode && (initialMode === 'ai' || initialMode === 'community')) {
      setActiveMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (q) {
      setSearchText(q);
      performSearch(q, initialMode === 'ai' ? 'ai' : activeMode);
    }
  }, [q]);

  const performSearch = async (queryToSearch?: string, targetMode?: SearchMode) => {
    const query = (queryToSearch ?? searchText).trim();
    if (!query) return;

    const mode = targetMode ?? activeMode;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      if (mode === 'community') {
        const response = await searchCommunityRecipes(query);
        const items = response?.items || [];
        setCommunityRecipes(items);
        if (items.length === 0) {
          Alert.alert('Thông báo', 'Không tìm thấy công thức nào từ cộng đồng. Bạn hãy thử từ khóa khác hoặc chuyển sang tab "AI Gợi ý" nhé!');
        }
      } else {
        // AI Mode: tách nguyên liệu bằng dấu phẩy nếu có, hoặc gửi toàn bộ cụm từ
        const ingredients = query.includes(',')
          ? query.split(',').map((s) => s.trim()).filter(Boolean)
          : [query];

        const response = await searchRecipes(ingredients);
        const recipes = response?.recipes || [];
        setAiRecipes(recipes);
        if (recipes.length === 0) {
          Alert.alert('Thông báo', 'Không tìm thấy gợi ý món ăn phù hợp. Bạn hãy thử thay đổi danh sách nguyên liệu nhé!');
        }
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra mạng và thử lại sau!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: SearchMode) => {
    if (newMode === activeMode) return;
    setActiveMode(newMode);

    // Nếu người dùng đã gõ từ khóa mà tab mới chưa có kết quả, tự động search luôn cho tiện
    if (searchText.trim()) {
      if (newMode === 'community' && communityRecipes.length === 0) {
        performSearch(searchText, 'community');
      } else if (newMode === 'ai' && aiRecipes.length === 0) {
        performSearch(searchText, 'ai');
      }
    }
  };

  const handleSaveAiRecipe = async (recipe: AIAnalysisResult) => {
    setIsSaving(true);
    try {
      await saveRecipeToDatabase(recipe);
      Alert.alert('Thành công! 🎉', `Đã thêm "${recipe.recipeName}" vào Sổ tay của bạn.`);
    } catch (error: any) {
      Alert.alert('Thông báo', error?.message || 'Không thể lưu lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectQuickSuggestion = (suggestion: string) => {
    setSearchText(suggestion);
    performSearch(suggestion, 'ai');
  };

  // Render thẻ công thức Cộng đồng
  const renderCommunityItem = ({ item }: { item: RecipeSummary }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => setSelectedCommunityRecipe(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500' }}
        style={styles.recipeImage}
        resizeMode="cover"
      />
      <View style={styles.recipeDetails}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.recipeSnippet} numberOfLines={1}>
          {item.author?.name ? `Tác giả: ${item.author.name}` : 'Tác giả: Ẩn danh'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaBadge}>⭐ {item.ratings_avg || 0} ({item.ratings_count || 0})</Text>
          <Text style={styles.metaBadge}>💬 {item.comments_count || 0}</Text>
          {item.cook_time_minutes ? (
            <Text style={styles.metaBadge}>⏱ {item.cook_time_minutes}p</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.arrowIconContainer}>
        <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
      </View>
    </TouchableOpacity>
  );

  // Render thẻ gợi ý AI
  const renderAiItem = ({ item }: { item: AIAnalysisResult }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => setSelectedAiRecipe(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500' }}
        style={styles.recipeImage}
        resizeMode="cover"
      />
      <View style={styles.recipeDetails}>
        <View style={styles.aiTagRow}>
          <Text style={styles.aiTag}>✨ AI CHEF</Text>
        </View>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.recipeName}
        </Text>
        <Text style={styles.recipeSnippet} numberOfLines={2}>
          {item.instructions?.[0] || 'Gợi ý món ăn thông minh từ Gemini'}
        </Text>
        <Text style={styles.ingredientsSummary} numberOfLines={1}>
          🛒 {item.ingredients.map((ing) => ing.name).join(' · ')}
        </Text>
      </View>
      <View style={styles.arrowIconContainer}>
        <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.title}>Tìm Kiếm Công Thức</Text>
      </View>

      {/* Segmented Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeMode === 'community' && styles.activeTabButton]}
          onPress={() => handleModeChange('community')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="restaurant-outline"
            size={18}
            color={activeMode === 'community' ? '#fff' : '#555'}
          />
          <Text style={[styles.tabButtonText, activeMode === 'community' && styles.activeTabText]}>
            Cộng đồng ({communityRecipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeMode === 'ai' && styles.activeTabButton]}
          onPress={() => handleModeChange('ai')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sparkles"
            size={18}
            color={activeMode === 'ai' ? '#fff' : '#28a745'}
          />
          <Text style={[styles.tabButtonText, activeMode === 'ai' && styles.activeTabText]}>
            Gợi ý AI ({aiRecipes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={22} color="#626262" style={styles.searchIcon} />
          <TextInput
            placeholder={
              activeMode === 'community'
                ? 'Tìm món ăn, nguyên liệu, tác giả...'
                : 'Nhập nguyên liệu: thịt gà, nấm, súp lơ...'
            }
            placeholderTextColor="#8d8d8d"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} style={styles.clearButton} hitSlop={8}>
              <MaterialIcons name="close" size={20} color="#8d8d8d" />
            </Pressable>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => performSearch()}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Gợi ý nhanh (Quick Chips) cho Tab AI khi chưa tìm kiếm */}
      {activeMode === 'ai' && aiRecipes.length === 0 && !isLoading && (
        <View style={styles.suggestionsWrapper}>
          <Text style={styles.suggestionsHeader}>💡 Gợi ý tìm kiếm với AI:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionChips}>
            {AI_QUICK_SUGGESTIONS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => handleSelectQuickSuggestion(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="flash-outline" size={13} color="#28a745" />
                <Text style={styles.suggestionChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Body Content */}
      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#28a745" />
            <Text style={styles.loadingText}>
              {activeMode === 'community'
                ? 'Đang tìm kiếm công thức từ cộng đồng...'
                : 'Gemini AI đang gợi ý món ăn dinh dưỡng...'}
            </Text>
          </View>
        ) : activeMode === 'community' ? (
          communityRecipes.length > 0 ? (
            <FlatList
              data={communityRecipes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCommunityItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyEmoji}>🥬🍳🥕</Text>
              <Text style={styles.emptyText}>
                Nhập tên món ăn, tác giả hoặc nguyên liệu để tìm kiếm các công thức hấp dẫn từ cộng đồng nhé!
              </Text>
            </View>
          )
        ) : aiRecipes.length > 0 ? (
          <FlatList
            data={aiRecipes}
            keyExtractor={(item, index) => `${item.recipeName}-${index}`}
            renderItem={renderAiItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyEmoji}>🍲✨🥦</Text>
            <Text style={styles.emptyText}>
              Nhập các nguyên liệu bạn đang có trong tủ lạnh (ngăn cách bởi dấu phẩy) để AI gợi ý thực đơn phù hợp nhất!
            </Text>
          </View>
        )}
      </View>

      {/* Modal 1: Chi tiết công thức Cộng đồng */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedCommunityRecipe !== null}
        onRequestClose={() => setSelectedCommunityRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedCommunityRecipe(null)} />
          <View style={styles.modalContent}>
            {selectedCommunityRecipe && (
              <>
                <View style={styles.handleBar} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedCommunityRecipe.title}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedCommunityRecipe.image && (
                    <Image
                      source={{ uri: selectedCommunityRecipe.image }}
                      style={styles.recipeHeroImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Thông tin chung</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tác giả:</Text>
                      <Text style={styles.infoValue}>
                        {selectedCommunityRecipe.author?.name || 'Ẩn danh'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Thời gian nấu:</Text>
                      <Text style={styles.infoValue}>
                        {selectedCommunityRecipe.cook_time_minutes ? `${selectedCommunityRecipe.cook_time_minutes} phút` : 'Chưa rõ'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Độ khó:</Text>
                      <Text style={styles.infoValue}>
                        {selectedCommunityRecipe.difficulty || 'Bình thường'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Đánh giá:</Text>
                      <Text style={styles.infoValue}>
                        ⭐ {selectedCommunityRecipe.ratings_avg || 0} ({selectedCommunityRecipe.ratings_count || 0} lượt)
                      </Text>
                    </View>
                  </View>
                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => {
                      const recipeId = selectedCommunityRecipe.id;
                      setSelectedCommunityRecipe(null);
                      router.push({ pathname: '/recipe/[id]', params: { id: recipeId } });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveButtonText}>Xem toàn bộ công thức</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setSelectedCommunityRecipe(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 2: Chi tiết công thức do AI sinh ra */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedAiRecipe !== null}
        onRequestClose={() => setSelectedAiRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedAiRecipe(null)} />
          <View style={styles.modalContent}>
            {selectedAiRecipe && (
              <>
                <View style={styles.handleBar} />
                <View style={styles.modalHeader}>
                  <View style={styles.aiBadgeInline}>
                    <Ionicons name="sparkles" size={14} color="#28a745" />
                    <Text style={styles.aiBadgeInlineText}>Gợi ý bởi AI Gemini</Text>
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedAiRecipe.recipeName}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedAiRecipe.imageUrl && (
                    <Image
                      source={{ uri: selectedAiRecipe.imageUrl }}
                      style={styles.recipeHeroImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>🛒 Nguyên liệu cần thiết</Text>
                    {selectedAiRecipe.ingredients.map((item, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <View style={styles.ingredientDot} />
                        <Text style={styles.ingredientText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>🍳 Các bước thực hiện</Text>
                    {selectedAiRecipe.instructions.map((step, index) => (
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

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => handleSaveAiRecipe(selectedAiRecipe)}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>❤️ Lưu vào Sổ tay của tôi</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setSelectedAiRecipe(null)}
                    activeOpacity={0.8}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f3ea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e2d8',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2ddd3',
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d4d0c7',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  suggestionsWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    marginBottom: 6,
  },
  suggestionChips: {
    gap: 8,
    paddingRight: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 8,
    gap: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ede8df',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    padding: 10,
    alignItems: 'center',
  },
  recipeImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#f0ece3',
  },
  recipeDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  aiTagRow: {
    marginBottom: 3,
  },
  aiTag: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: '#28a745',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    lineHeight: 20,
    marginBottom: 3,
  },
  recipeSnippet: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
  ingredientsSummary: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
  },
  arrowIconContainer: {
    paddingLeft: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 21,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#e0ded8',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    marginBottom: 12,
  },
  aiBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiBadgeInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#28a745',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    lineHeight: 24,
  },
  modalBody: {
    maxHeight: 380,
  },
  recipeHeroImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 14,
  },
  sectionBox: {
    backgroundColor: '#faf8f5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0ece3',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 13,
    color: '#333',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
  },
  modalActions: {
    gap: 8,
    paddingTop: 10,
  },
  actionButton: {
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  closeButton: {
    backgroundColor: '#f2f0ea',
  },
  closeButtonText: {
    color: '#555',
    fontWeight: '700',
    fontSize: 14,
  },
});
