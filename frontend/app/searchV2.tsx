import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
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
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { searchRecipes, saveRecipeToDatabase, AIAnalysisResult } from "../services/aiService";

export default function SearchPage() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const [searchText, setSearchText] = useState("");
  const [recipes, setRecipes] = useState<AIAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<AIAnalysisResult | null>(null);

  // Tß╗▒ ─æß╗Öng t├¼m kiß║┐m nß║┐u c├│ param q truyß╗ün sang
  useEffect(() => {
    if (q) {
      setSearchText(q);
      performSearch(q);
    }
  }, [q]);

  const performSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch ?? searchText).trim();
    if (!query) return;

    // Tß║»t b├án ph├¡m
    Keyboard.dismiss();

    setIsLoading(true);
    try {
      // T├ích nguy├¬n liß╗çu bß╗ƒi dß║Ñu phß║⌐y hoß║╖c khoß║úng trß║»ng
      const ingredients = query
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await searchRecipes(ingredients);
      setRecipes(response?.recipes || []);
      if (!response?.recipes || response.recipes.length === 0) {
        Alert.alert("Th├┤ng b├ío", "Kh├┤ng t├¼m thß║Ñy m├│n ─ân n├áo ph├╣ hß╗úp. Bß║ín h├úy thß╗¡ thay ─æß╗òi danh s├ích nguy├¬n liß╗çu xem nh├⌐!");
      }
    } catch (error) {
      console.error("Lß╗ùi t├¼m kiß║┐m:", error);
      Alert.alert("Lß╗ùi", "─É├ú xß║úy ra lß╗ùi kß║┐t nß╗æi. Vui l├▓ng thß╗¡ lß║íi sau!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: AIAnalysisResult) => {
    setIsSaving(true);
    try {
      await saveRecipeToDatabase(recipe);
      Alert.alert("Th├ánh c├┤ng! ≡ƒÄë", `─É├ú th├¬m "${recipe.recipeName}" v├áo Sß╗ò tay cß╗ºa bß║ín.`);
    } catch (error: any) {
      Alert.alert("Th├┤ng b├ío", error.message || "Kh├┤ng thß╗â l╞░u l├║c n├áy. Vui l├▓ng thß╗¡ lß║íi sau.");
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
          {item.instructions && item.instructions[0] ? item.instructions[0] : "Ch╞░a c├│ h╞░ß╗¢ng dß║½n nß║Ñu cß╗Ñ thß╗â."}
        </Text>
        <Text style={styles.ingredientsSummary} numberOfLines={1}>
          ≡ƒ¢Æ {item.ingredients.map((ing) => ing.name).join(" ┬╖ ")}
        </Text>
      </View>
      <View style={styles.arrowIconContainer}>
        <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f3ea" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.title}>T├¼m Kiß║┐m Gß╗úi ├¥ M├│n ─én</Text>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={24} color="#626262" style={styles.searchIcon} />
          <TextInput
            placeholder="V├¡ dß╗Ñ: thß╗ït heo, c├á chua, h├ánh t├óy..."
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
          <Text style={styles.searchButtonText}>T├¼m</Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2ecc71" />
            <Text style={styles.loadingText}>Gemini ─æang vß║»t ├│c suy ngh─⌐ m├│n ─ân...</Text>
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
            <Text style={styles.emptyEmoji}>≡ƒÑ¼≡ƒì│≡ƒÑò</Text>
            <Text style={styles.emptyText}>
              Nhß║¡p c├íc nguy├¬n liß╗çu bß║ín c├│ v├áo ├┤ t├¼m kiß║┐m ß╗ƒ tr├¬n ─æß╗â AI gß╗úi ├╜ c├íc c├┤ng thß╗⌐c nß║Ñu ─ân ph├╣ hß╗úp nh├⌐!
            </Text>
          </View>
        )}
      </View>

      {/* Modal chi tiß║┐t c├┤ng thß╗⌐c */}
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
                    <Text style={styles.sectionTitle}>≡ƒ¢Æ Nguy├¬n liß╗çu cß║ºn thiß║┐t</Text>
                    {selectedRecipe.ingredients.map((item, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <View style={styles.ingredientDot} />
                        <Text style={styles.ingredientText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>≡ƒì│ H╞░ß╗¢ng dß║½n thß╗▒c hiß╗çn</Text>
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

                {/* N├║t h├ánh ─æß╗Öng */}
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
                      <Text style={styles.saveButtonText}>Γ¥ñ∩╕Å L╞░u v├áo sß╗ò tay cß╗ºa t├┤i</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setSelectedRecipe(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeButtonText}>─É├│ng</Text>
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
