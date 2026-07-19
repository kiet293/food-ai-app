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
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { getUserProfile } from "../../services/authService";
import useRecentSearches from "../../hooks/useRecentSearches";
import { searchRecipes } from "../../services/aiService";

type FeedCard = {
  title: string;
  author: string;
  image: ImageSourcePropType;
  tag?: string;
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
    tag: "Món chính 🍛",
  },
  {
    title: "Bánh ướt vỉa hè",
    author: "Huyen le Tran",
    image: { uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" },
    tag: "Ăn sáng 🥞",
  },
  {
    title: "Kem chuối giấy siêu dễ siêu ngon",
    author: "minh!",
    image: { uri: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80" },
    tag: "Tráng miệng 🍨",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState<string>("👨‍🍳");
  const [userInfo, setUserInfo] = useState<{ full_name: string } | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientCard | null>(null);
  const { items: recentItems, remove: removeRecent } = useRecentSearches();

  // Xác định câu chào động theo giờ
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Chào buổi sáng ☀️";
    if (hr < 18) return "Chào buổi chiều 🌤️";
    return "Chào buổi tối 🌙";
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        const profile = await getUserProfile();
        if (profile && isActive) {
          setUserInfo(profile);
          setUserAvatar(profile.avatar || "👨‍🍳");
        }
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

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
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Pressable
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
              hitSlop={8}
            >
              {isAvatarUrl ? (
                <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{userAvatar}</Text>
              )}
            </Pressable>

            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeSub}>{getGreeting()}</Text>
              <Text style={styles.welcomeTitle} numberOfLines={1}>
                {userInfo?.full_name || "Đầu Bếp Tại Gia"}
              </Text>
            </View>

            <View style={styles.notificationWrap}>
              <Text style={styles.notificationIcon}>🔔</Text>
              <View style={styles.notificationDot} />
            </View>
          </View>

          {/* Search Box Pressable */}
          <Pressable
            style={styles.searchBox}
            onPress={() => router.push('/search')}
          >
            <MaterialIcons name="search" size={28} color="#626262" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholderText}>Gõ vào tên các nguyên liệu...</Text>
          </Pressable>

          {/* Recent Searches Scroll (Horizontal Chips) */}
          {recentItems.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Tìm kiếm gần đây</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentChipsContainer}>
                {recentItems.map((r) => (
                  <View key={r} style={styles.recentChip}>
                    <TouchableOpacity
                      onPress={() => router.push(`/search?q=${encodeURIComponent(r)}`)}
                      style={styles.chipTextButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recentChipText} numberOfLines={1}>{r}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeRecent(r)} style={styles.chipCloseButton} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color="#8aab8a" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Banner Card */}
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

          {/* Section: Popular Ingredients */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nguyên Liệu Phổ Biến</Text>
          </View>

          <View style={styles.keywordGrid}>
            {ingredientCards.map((item) => (
              <Pressable key={item.name} style={styles.keywordCard} onPress={() => setSelectedIngredient(item)}>
                <Image source={item.image} style={styles.keywordImage} />
                <View style={styles.keywordScrim} />

                {/* Badge đếm số món gợi ý nấu */}
                <View style={styles.recipeCountBadge}>
                  <Text style={styles.recipeCountText}>{item.dishes.length} món</Text>
                </View>

                <Text style={styles.keywordLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Section: Premium */}
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumIcon}>🏅</Text>
            <Text style={styles.premiumTitle}>Premium Đặc Quyền</Text>
          </View>

          <View style={styles.premiumList}>
            {premiumItems.map((item) => (
              <Pressable key={item.title} style={styles.premiumRow}>
                <Image source={item.image} style={styles.premiumThumb} />
                <View style={styles.premiumTextWrap}>
                  <Text style={styles.premiumRowTitle}>{item.title}</Text>
                  <Text style={styles.premiumRowSubtitle}>{item.author}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
              </Pressable>
            ))}
          </View>

          {/* Section: Newest Recipes */}
          <View style={styles.sectionHeaderLarge}>
            <Text style={styles.sectionTitle}>Mới lên sóng gần đây ✨</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newestRow}>
            {newestRecipes.map((item) => (
              <Pressable key={item.title} style={styles.newestCard}>
                <View style={styles.newestImageWrap}>
                  <Image source={item.image} style={styles.newestImage} />
                  {item.tag && (
                    <View style={styles.newestTagBadge}>
                      <Text style={styles.newestTagText}>{item.tag}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.newestTextBox}>
                  <Text style={styles.newestTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.newestAuthor} numberOfLines={1}>
                    🍳 Bởi {item.author}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Floating FAB to open camera screen */}
        <View style={styles.floatingDock} pointerEvents="box-none">
          <Pressable style={styles.fab} onPress={() => router.push('/modal')} hitSlop={8}>
            <MaterialIcons name="add" size={30} color="#fff" />
          </Pressable>
        </View>

        {/* Selected Ingredient Modal (Bottom Sheet style) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedIngredient !== null}
          onRequestClose={() => setSelectedIngredient(null)}
        >
          <View style={styles.ingredientModalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedIngredient(null)} />
            <View style={styles.ingredientModalCard}>
              {selectedIngredient && (
                <>
                  <View style={styles.handleBar} />

                  <View style={styles.ingredientModalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingredientModalTitle}>{selectedIngredient.name}</Text>
                      <Text style={styles.ingredientModalSubtitle}>Thành phần dinh dưỡng & Lợi ích</Text>
                    </View>
                    <Pressable onPress={() => setSelectedIngredient(null)} style={styles.closeIngredientButton} hitSlop={8}>
                      <MaterialIcons name="close" size={20} color="#1a3a1a" />
                    </Pressable>
                  </View>

                  <ScrollView style={styles.ingredientModalBody} showsVerticalScrollIndicator={false}>
                    <Image source={selectedIngredient.image} style={styles.ingredientHeroImage} resizeMode="cover" />

                    <View style={styles.modalSectionBox}>
                      <Text style={styles.modalSectionTitle}>🛒 Thành phần chủ yếu</Text>
                      {selectedIngredient.composition.map((item) => (
                        <View key={item} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.modalSectionBox}>
                      <Text style={styles.modalSectionTitle}>❤️ Lợi ích cho sức khỏe</Text>
                      {selectedIngredient.benefits.map((item) => (
                        <View key={item} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.modalSectionBox}>
                      <Text style={styles.modalSectionTitle}>🍳 Món ngon đề xuất</Text>
                      {selectedIngredient.dishes.map((item) => (
                        <View key={item} style={styles.bulletRow}>
                          <View style={[styles.bulletDot, { backgroundColor: '#e67e22' }]} />
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={{ height: 30 }} />
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
  },
  root: {
    flex: 1,
    backgroundColor: "#f0f4f0",
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2ecc71",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  welcomeTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeSub: {
    fontSize: 12,
    color: "#8aab8a",
    fontWeight: "600",
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a3a1a",
    marginTop: 2,
  },
  notificationWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4757",
  },
  searchBox: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#dde8dd",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 15,
    color: "#adc6ad",
    fontWeight: "500",
  },
  recentSection: {
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 13,
    color: "#8aab8a",
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
  },
  recentChipsContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde8dd",
    paddingLeft: 12,
    paddingRight: 6,
    height: 32,
  },
  chipTextButton: {
    marginRight: 4,
  },
  recentChipText: {
    fontSize: 13,
    color: "#1a3a1a",
    fontWeight: "600",
  },
  chipCloseButton: {
    padding: 2,
  },
  bannerCard: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#d8c6a5",
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 58, 26, 0.2)",
  },
  bannerContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  bannerDatePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  bannerDateText: {
    color: "#2ecc71",
    fontWeight: "700",
    fontSize: 11,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  bannerHashtag: {
    color: "#f0f4f0",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderLarge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a3a1a",
  },
  keywordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  keywordCard: {
    width: "48%",
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  keywordImage: {
    width: "100%",
    height: "100%",
  },
  keywordScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  recipeCountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(26, 58, 26, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recipeCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  keywordLabel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  premiumIcon: {
    fontSize: 24,
    marginRight: 6,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a3a1a",
  },
  premiumList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e8f0e8",
  },
  premiumRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4f0",
  },
  premiumThumb: {
    width: 64,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#f0f4f0",
  },
  premiumTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  premiumRowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a3a1a",
    marginBottom: 4,
  },
  premiumRowSubtitle: {
    fontSize: 12,
    color: "#8aab8a",
  },
  newestRow: {
    paddingBottom: 8,
    paddingHorizontal: 2,
    gap: 12,
  },
  newestCard: {
    width: 170,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#1a3a1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e8f0e8",
  },
  newestImageWrap: {
    position: "relative",
  },
  newestImage: {
    width: "100%",
    height: 120,
  },
  newestTagBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#2ecc71",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newestTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  newestTextBox: {
    padding: 12,
  },
  newestTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#1a3a1a",
    marginBottom: 6,
  },
  newestAuthor: {
    fontSize: 12,
    color: "#8aab8a",
    fontWeight: "500",
  },
  floatingDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
  // Modal Bottom Sheet Styles
  ingredientModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  ingredientModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "82%",
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
  ingredientModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f0e8",
  },
  ingredientModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a3a1a",
  },
  ingredientModalSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#8aab8a",
  },
  closeIngredientButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f4f0",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientHeroImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  ingredientModalBody: {
    flex: 1,
  },
  modalSectionBox: {
    backgroundColor: "#f7fbf7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8f0e8",
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a3a1a",
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ecc71",
    marginRight: 10,
  },
  bulletText: {
    fontSize: 14,
    color: "#2d4a2d",
    flex: 1,
  },
});