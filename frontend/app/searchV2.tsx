import { SafeAreaView } from 'react-native-safe-area-context';
﻿import React, { useEffect, useState } from "react";
import {
  
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { searchRecipes, AIAnalysisResult } from "../services/ai/aiService";
import { saveRecipeToDatabase } from "../services/recipe/recipeService";

export default function SearchPage() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const [searchText, setSearchText] = useState("");
  const [recipes, setRecipes] = useState<AIAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<AIAnalysisResult | null>(null);

  // Tự động tìm kiếm nếu có param q truyền sang
  useEffect(() => {
    if (q) {
      setSearchText(q);
      performSearch(q);
    }
  }, [q]);

  const performSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch ?? searchText).trim();
    if (!query) return;

    // Tắt bàn phím
    Keyboard.dismiss();

    setIsLoading(true);
    try {
      // Tách nguyên liệu bởi dấu phẩy hoặc khoảng trắng
      const ingredients = query
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await searchRecipes(ingredients);
      setRecipes(response?.recipes || []);
      if (!response?.recipes || response.recipes.length === 0) {
        Alert.alert("Thông báo", "Không tìm thấy món ăn nào phù hợp. Bạn hãy thử thay đổi danh sách nguyên liệu xem nhé!");
      }
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: AIAnalysisResult) => {
    setIsSaving(true);
    try {
      await saveRecipeToDatabase(recipe);
      Alert.alert("Thành công! 🎉", `Đã thêm "${recipe.recipeName}" vào Sổ tay của bạn.`);
    } catch (error: any) {
      Alert.alert("Thông báo", error.message || "Không thể lưu lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderRecipeItem = ({ item }: { item: AIAnalysisResult }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => setSelectedRecipe(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500" }}
        style={styles.recipeImage}
        resizeMode="cover"
      />
      <View style={styles.recipeDetails}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.recipeName}
        </Text>
        <Text style={styles.recipeSnippet} numberOfLines={2}>
          {item.instructions && item.instructions[0] ? item.instructions[0] : "Chưa có hướng dẫn nấu cụ thể."}
        </Text>
        <Text style={styles.ingredientsSummary} numberOfLines={1}>
          🛒 {item.ingredients.map((ing) => ing.name).join(" · ")}
        </Text>
      </View>
      <View style={styles.arrowIconContainer}>
        <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#f6f3ea" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.title}>Tìm Kiếm Gợi Ý Món Ăn</Text>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={24} color="#626262" style={styles.searchIcon} />
          <TextInput
            placeholder="Ví dụ: thịt heo, cà chua, hành tây..."
            placeholderTextColor="#8d8d8d"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} style={styles.clearButton} hitSlop={8}>
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

      {/* Body Content */}
      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2ecc71" />
            <Text style={styles.loadingText}>Gemini đang vắt óc suy nghĩ món ăn...</Text>
          </View>
        ) : recipes.length > 0 ? (
          <FlatList
            data={recipes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderRecipeItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyEmoji}>🥬🍲🥕</Text>
            <Text style={styles.emptyText}>
              Nhập các nguyên liệu bạn có vào ô tìm kiếm ở trên để AI gợi ý các công thức nấu ăn phù hợp nhé!
            </Text>
          </View>
        )}
      </View>

      {/* Modal chi tiết công thức */}
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
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedRecipe.recipeName}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedRecipe.imageUrl && (
                    <Image
                      source={{ uri: selectedRecipe.imageUrl }}
                      style={styles.recipeHeroImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>🛒 Nguyên liệu cần thiết</Text>
                    {selectedRecipe.ingredients.map((item, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <View style={styles.ingredientDot} />
                        <Text style={styles.ingredientText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>🍳 Hướng dẫn thực hiện</Text>
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

                {/* Nút hành động */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => handleSaveRecipe(selectedRecipe)}
                    disabled={isSaving}
                    activeOpacity={0.8}
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
    backgroundColor: "#f6f3ea",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e2d8",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f6f3ea",
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d4d0c7",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: "#2ecc71",
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2ecc71",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    backgroundColor: "#f0f4f0",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 14,
    color: "#555",
    fontSize: 15,
    textAlign: "center",
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#8aab8a",
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#2ecc71",
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#e8f0e8",
  },
  recipeDetails: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a3a1a",
    marginBottom: 4,
  },
  recipeSnippet: {
    fontSize: 13,
    color: "#8aab8a",
    marginBottom: 4,
  },
  ingredientsSummary: {
    fontSize: 12,
    color: "#6b8f6b",
    fontWeight: "500",
  },
  arrowIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dde8dd",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f0e8",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a3a1a",
    textAlign: "center",
    lineHeight: 28,
  },
  modalBody: {
    flex: 1,
  },
  recipeHeroImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#e8f0e8",
  },
  sectionBox: {
    backgroundColor: "#f7fbf7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a3a1a",
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ecc71",
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 15,
    color: "#2d4a2d",
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2ecc71",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#2d4a2d",
    flex: 1,
  },
  modalActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 2,
    backgroundColor: "#2ecc71",
    shadowColor: "#2ecc71",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#f0f4f0",
  },
  closeButtonText: {
    color: "#2d4a2d",
    fontSize: 15,
    fontWeight: "700",
  },
});
