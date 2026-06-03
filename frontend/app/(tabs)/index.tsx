import React from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  SafeAreaView,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { getUserProfile } from "../../services/authService";
import useRecentSearches from "../../hooks/useRecentSearches";
import { searchRecipes } from "../../services/aiService";

type KeywordCard = {
  title: string;
  image: ImageSourcePropType;
};

type FeedCard = {
  title: string;
  author: string;
  image: ImageSourcePropType;
};

type IngredientCard = {
  name: string;
  image: ImageSourcePropType;
  composition: string[];
  benefits: string[];
  dishes: string[];
};

const ingredientCards: IngredientCard[] = [
  {
    name: "Thịt bò",
    image: { uri: "https://cdn.tgdd.vn/2022/03/CookDish/cach-bao-quan-thit-bo-trong-tu-lanh-va-khong-co-tu-lanh-luu-y-avt-1200x676.jpg" },
    composition: ["Giàu protein chất lượng cao", "Sắt heme dễ hấp thu", "Kẽm, vitamin B12, B6"],
    benefits: ["Hỗ trợ tạo máu và giảm thiếu sắt", "Giúp phục hồi cơ bắp sau vận động", "Tạo cảm giác no lâu"],
    dishes: ["Bò xào rau củ", "Phở bò", "Bò kho", "Bít tết áp chảo"],
  },
  {
    name: "Tôm",
    image: { uri: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80" },
    composition: ["Protein nạc", "I-ốt và selen", "Vitamin B12, omega-3"],
    benefits: ["Tốt cho tuyến giáp", "Ít béo, phù hợp bữa ăn nhẹ", "Bổ sung khoáng chất cho cơ thể"],
    dishes: ["Tôm rang me", "Canh chua tôm", "Tôm hấp sả", "Mì xào tôm"],
  },
  {
    name: "Thịt heo",
    image: { uri: "https://vavc.edu.vn/uploads/images/255420380_4438273872886334_6849360604609483408_n.jpg" },
    composition: ["Protein", "Vitamin B1, B3, B6", "Kẽm và selen"],
    benefits: ["Dễ chế biến, hợp nhiều món", "Cung cấp năng lượng nhanh", "Giúp đa dạng khẩu phần bữa ăn"],
    dishes: ["Thịt heo kho tàu", "Thịt heo rang cháy cạnh", "Sườn rim", "Canh bí nấu thịt"],
  },
  {
    name: "Cà chua",
    image: { uri: "https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2021/9/25/tac-dung-cua-ca-chua-doi-voi-suc-khoe-1-1632310636-831-width640height427-1632567723926-16325677242441321628137.jpg" },
    composition: ["Lycopene", "Vitamin C, K, folate", "Chất xơ và nước"],
    benefits: ["Hỗ trợ tim mạch và làn da", "Giúp bữa ăn tươi, dễ tiêu", "Bổ sung chất chống oxy hóa"],
    dishes: ["Trứng chiên cà chua", "Canh chua cà chua", "Mì sốt cà", "Salad cà chua"],
  },
  {
    name: "Trứng",
    image: { uri: "https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2025/3/8/photo-1741408427825-17414084285131651116857.jpeg" },
    composition: ["Protein hoàn chỉnh", "Choline", "Vitamin A, D, B12"],
    benefits: ["Dễ ăn, dễ nấu", "Hỗ trợ phát triển cơ và não bộ", "Phù hợp bữa sáng nhanh"],
    dishes: ["Trứng ốp la", "Trứng chiên", "Trứng kho thịt", "Canh trứng cà chua"],
  },
  {
    name: "Khoai tây",
    image: { uri: "https://hongngochospital.vn/wp-content/uploads/2020/02/dinh-duong-tu-khoai-tay.jpg" },
    composition: ["Tinh bột", "Vitamin C, B6", "Kali và chất xơ"],
    benefits: ["Cung cấp năng lượng nhanh", "No lâu, dễ kết hợp món mặn", "Hợp nhiều kiểu chế biến"],
    dishes: ["Khoai tây nghiền", "Khoai tây xào", "Canh khoai tây hầm", "Bò hầm khoai tây"],
  },
];

const premiumItems: FeedCard[] = [
  {
    title: "Món Có Nhiều Cooksnap Nhất",
    author: "Các công thức có hơn 10 cooksnap",
    image: { uri: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80" },
  },
  {
    title: "Món Có Nhiều Lượt Xem Nhất",
    author: "Các công thức được xem nhiều nhất, cập nhật mỗi ngày",
    image: { uri: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80" },
  },
];

const newestRecipes: FeedCard[] = [
  {
    title: "Phá Lấu Lòng Heo Kiểu Triều Châu",
    author: "Bòn Bon",
    image: { uri: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80" },
  },
  {
    title: "Bánh ướt vỉa hè",
    author: "Huyen le Tran",
    image: { uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" },
  },
  {
    title: "Kem chuối giấy siêu dễ siêu ngon",
    author: "minh!",
    image: { uri: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80" },
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState<string>("👨‍🍳");
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientCard | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const { items: recentItems, addSearch, remove: removeRecent } = useRecentSearches();
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        const profile = await getUserProfile();
        if (profile && isActive) {
          setUserAvatar(profile.avatar || "👨‍🍳");
        }
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleSearch = async (override?: string) => {
    const q = ((override ?? searchText) || "").trim();
    if (!q) return;
    try {
      await addSearch(q);
      // Chuẩn hóa: tách bởi dấu phẩy hoặc khoảng trắng
      const ingredients = q.split(",").map((s) => s.trim()).filter(Boolean);
      console.log("🔎 Tìm kiếm nguyên liệu:", ingredients);
      setIsSearching(true);
      const res = await searchRecipes(ingredients);
      console.log("🔎 Kết quả tìm kiếm:", res);
      setSearchResults(res?.recipes || []);
      setIsSearching(false);
    } catch (e) {
      console.warn("Tìm kiếm lỗi:", e);
    }
  };

  const isAvatarUrl = userAvatar.startsWith("http://") || userAvatar.startsWith("https://");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f3ea" />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable 
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
            >
              {isAvatarUrl ? (
                <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{userAvatar}</Text>
              )}
            </Pressable>
            <Text style={styles.pageTitle}>Tìm Kiếm</Text>
            <View style={styles.notificationWrap}>
              <Text style={styles.notificationIcon}>🔔</Text>
              <View style={styles.notificationDot} />
            </View>
          </View>

          <Pressable 
            style={styles.searchBox} 
            onPress={() => router.push('/search')}
          >
            <MaterialIcons name="search" size={30} color="#626262" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholderText}>Gõ vào tên các nguyên liệu...</Text>
          </Pressable>

          {recentItems.length > 0 && (
            <View style={styles.recentList}>
              {recentItems.map((r) => (
                <View key={r} style={styles.recentRow}>
                  <Text style={styles.recentClock}>🕘</Text>
                  <Pressable style={styles.recentTextWrap} onPress={() => router.push(`/search?q=${encodeURIComponent(r)}`)}>
                    <Text style={styles.recentText} numberOfLines={1}>{r}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeRecent(r)} style={styles.recentRemove}>
                    <Text style={styles.recentRemoveText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* KHU VỰC HIỂN THỊ KẾT QUẢ TÌM KIẾM */}
          <View style={styles.resultsArea}>
            {isSearching ? (
              <View style={styles.resultsLoading}>
                <ActivityIndicator size="small" color="#333" />
                <Text style={styles.resultsLoadingText}>Đang tìm kiếm...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                {searchResults.map((it, idx) => (
                  <Pressable key={idx} style={styles.resultCard}>
                    {it.imageUrl ? (
                      <Image source={{ uri: it.imageUrl }} style={styles.resultThumb} />
                    ) : (
                      <View style={styles.resultThumbPlaceholder} />
                    )}
                    <View style={styles.resultTextWrap}>
                      <Text style={styles.resultTitle} numberOfLines={2}>{it.title || it.recipeName || 'Gợi ý món'}</Text>
                      <Text style={styles.resultSnippet} numberOfLines={2}>{(it.instructions && it.instructions[0]) || ''}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.bannerCard}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" }}
              style={styles.bannerImage}
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerContent}>
              <View style={styles.bannerDatePill}>
                <Text style={styles.bannerDateText}>18/05 - 24/05</Text>
              </View>
              <Text style={styles.bannerTitle}>Quán ngon vỉa hè tại gia</Text>
              <Text style={styles.bannerHashtag}>#2026CookpadApron</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nguyên Liệu Phổ Biến</Text>
      
          </View>

          <View style={styles.keywordGrid}>
            {ingredientCards.map((item) => (
              <Pressable key={item.name} style={styles.keywordCard} onPress={() => setSelectedIngredient(item)}>
                <Image source={item.image} style={styles.keywordImage} />
                <View style={styles.keywordScrim} />
                <Text style={styles.keywordLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.premiumHeader}>
            <Text style={styles.premiumIcon}>🏅</Text>
            <Text style={styles.premiumTitle}>Premium</Text>
          </View>

          <View style={styles.premiumList}>
            {premiumItems.map((item) => (
              <Pressable key={item.title} style={styles.premiumRow}>
                <Image source={item.image} style={styles.premiumThumb} />
                <View style={styles.premiumTextWrap}>
                  <Text style={styles.premiumRowTitle}>{item.title}</Text>
                  <Text style={styles.premiumRowSubtitle}>{item.author}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeaderLarge}>
            <Text style={styles.sectionTitle}>Mới lên sóng gần đây</Text>
            <Text style={styles.arrow}>→</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newestRow}>
            {newestRecipes.map((item) => (
              <Pressable key={item.title} style={styles.newestCard}>
                <Image source={item.image} style={styles.newestImage} />
                <View style={styles.newestTextBox}>
                  <Text style={styles.newestTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.newestAuthor} numberOfLines={1}>
                    {item.author}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </ScrollView>

        <View style={styles.floatingDock} pointerEvents="box-none">
          <Pressable style={styles.fab} onPress={() => router.push('/modal')} hitSlop={8}>
            <MaterialIcons name="add" size={30} color="#fff" />
          </Pressable>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedIngredient !== null}
          onRequestClose={() => setSelectedIngredient(null)}
        >
          <View style={styles.ingredientModalOverlay}>
            <View style={styles.ingredientModalCard}>
              {selectedIngredient && (
                <>
                  <View style={styles.ingredientModalHeader}>
                    <View>
                      <Text style={styles.ingredientModalTitle}>{selectedIngredient.name}</Text>
                      <Text style={styles.ingredientModalSubtitle}>Thành phần, lợi ích và món ăn gợi ý</Text>
                    </View>
                    <Pressable onPress={() => setSelectedIngredient(null)} style={styles.closeIngredientButton}>
                      <Text style={styles.closeIngredientButtonText}>✕</Text>
                    </Pressable>
                  </View>

                  <Image source={selectedIngredient.image} style={styles.ingredientHeroImage} />

                  <ScrollView style={styles.ingredientModalBody} showsVerticalScrollIndicator={false}>
                    <Text style={styles.ingredientSectionTitle}>Thành phần dinh dưỡng</Text>
                    {selectedIngredient.composition.map((item) => (
                      <Text key={item} style={styles.ingredientBulletText}>• {item}</Text>
                    ))}

                    <Text style={styles.ingredientSectionTitle}>Lợi ích khi ăn</Text>
                    {selectedIngredient.benefits.map((item) => (
                      <Text key={item} style={styles.ingredientBulletText}>• {item}</Text>
                    ))}

                    <Text style={styles.ingredientSectionTitle}>Món ăn có thể nấu</Text>
                    {selectedIngredient.dishes.map((item) => (
                      <Text key={item} style={styles.ingredientBulletText}>• {item}</Text>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f3ea",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  root: {
    flex: 1,
    backgroundColor: "#f6f3ea",
  },
  scrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 180,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0d5e4f",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  pageTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 30,
    fontWeight: "800",
    color: "#111",
  },
  notificationWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    fontSize: 28,
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#ff4b37",
  },
  searchBox: {
    minHeight: 58,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#d4d0c7",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  searchIcon: {
    marginRight: 12,
    marginTop: -2,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: "#111",
    paddingVertical: 0,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 18,
    color: "#8d8d8d",
  },
  bannerCard: {
    height: 228,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#d8c6a5",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  bannerContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  bannerDatePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(241, 241, 225, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 10,
  },
  bannerDateText: {
    color: "#58734d",
    fontWeight: "800",
    fontSize: 14,
  },
  bannerTitle: {
    color: "#fff5a8",
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: 8,
  },
  bannerHashtag: {
    color: "#fefbe8",
    fontSize: 24,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  sectionHeaderLarge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    color: "#111",
  },
  sectionMeta: {
    fontSize: 14,
    color: "#8b857b",
    marginBottom: 4,
  },
  keywordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  recentList: {
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ece8de",
  },
  recentClock: {
    fontSize: 18,
    marginRight: 10,
    color: "#6b665c",
  },
  recentTextWrap: {
    flex: 1,
  },
  recentText: {
    fontSize: 16,
    color: "#333",
  },
  recentRemove: {
    marginLeft: 12,
    padding: 6,
  },
  recentRemoveText: {
    fontSize: 16,
    color: "#777",
  },
  resultsArea: {
    marginTop: 6,
    marginBottom: 12,
  },
  resultsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultsLoadingText: {
    marginLeft: 10,
    color: '#444',
  },
  resultsList: {
    marginTop: 6,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ece8de',
  },
  resultThumb: {
    width: 72,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#e9e5dd',
  },
  resultThumbPlaceholder: {
    width: 72,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f1efe8',
  },
  resultTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 14,
    color: '#6b655c',
  },
  keywordCard: {
    width: "48%",
    height: 132,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#ddd",
  },
  keywordImage: {
    width: "100%",
    height: "100%",
  },
  keywordScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  keywordLabel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ingredientModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  ingredientModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingBottom: 18,
  },
  ingredientModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  ingredientModalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },
  ingredientModalSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6d655c",
  },
  closeIngredientButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIngredientButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  ingredientHeroImage: {
    width: "100%",
    height: 180,
  },
  ingredientModalBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  ingredientSectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
    marginTop: 8,
  },
  ingredientBulletText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    marginBottom: 8,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  premiumIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  premiumTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    color: "#111",
  },
  premiumList: {
    backgroundColor: "transparent",
  },
  premiumRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd7ca",
  },
  premiumThumb: {
    width: 92,
    height: 74,
    borderRadius: 8,
    backgroundColor: "#e7e1d8",
  },
  premiumTextWrap: {
    flex: 1,
    marginLeft: 16,
  },
  premiumRowTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    color: "#111",
    marginBottom: 6,
  },
  premiumRowSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: "#2f2f2f",
  },
  arrow: {
    fontSize: 34,
    color: "#6c645a",
    marginBottom: -2,
  },
  newestRow: {
    paddingBottom: 8,
  },
  newestCard: {
    width: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginRight: 12,
    shadowColor: "#1d1b19",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  newestImage: {
    width: "100%",
    height: 150,
  },
  newestTextBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  newestTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    color: "#111",
    marginBottom: 8,
  },
  newestAuthor: {
    fontSize: 16,
    color: "#7a6f61",
  },
  floatingDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 38,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dockPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 34,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#211f1a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 8,
  },
  dockPin: {
    fontSize: 22,
    marginRight: 10,
    color: "#c6c6c6",
  },
  dockText: {
    fontSize: 18,
    color: "#c3c3c3",
    fontWeight: "700",
  },
  dockDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#d0c7bb",
    marginHorizontal: 14,
  },
  dockCalendar: {
    fontSize: 22,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2ecc71",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2ecc71",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});