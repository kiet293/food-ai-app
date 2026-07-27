import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Image,
  ScrollView,
  Switch,
  Dimensions,
  Share,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { getUserProfile, logoutUser, updateUserProfile, updateUserAvatar } from '../../services/authService';
import { getSavedRecipes } from '../../services/aiService';
import { useAuth } from '../_layout';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 6) / 3; // Lưới 3 cột chuẩn TikTok

const EMOJI_LIST = ['👨‍🍳', '👩‍🍳', '🥷', '🐱', '🐻', '🦊', '🦁', '🥑', '🍕', '🍣', '☕', '🔥'];

export interface ProfileUserData {
  id?: number;
  username: string;
  full_name: string;
  avatar: string;
  bio?: string;
  status_badge?: string;
  following_count: number;
  follower_count: number;
  total_likes_count: number;
  saved_recipes_count: number;
  my_reels?: any[];
  liked_reels?: any[];
  joined_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [userInfo, setUserInfo] = useState<ProfileUserData | null>(null);
  const [savedRecipesList, setSavedRecipesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab đang chọn: 'posted' (Lưới video), 'saved' (Công thức đã lưu), 'liked' (Video đã thích), 'private' (Riêng tư)
  const [activeTab, setActiveTab] = useState<'posted' | 'saved' | 'liked' | 'private'>('posted');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal Hamburger Settings (Nút 3 gạch)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal Chỉnh sửa hồ sơ
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🍳');
  const [isSaving, setIsSaving] = useState(false);

  const isUrl = (str: string) => str && (str.startsWith('http://') || str.startsWith('https://'));

  // Lấy dữ liệu hồ sơ từ Backend
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      if (data) {
        setUserInfo(data);
        setEditFullName(data.full_name || '');
        setSelectedAvatar(data.avatar || '👨‍🍳');
      }

      // Lấy danh sách công thức đã lưu
      const recipes = await getSavedRecipes();
      setSavedRecipesList(recipes || []);
    } catch (e) {
      console.warn("Lỗi tải thông tin cá nhân:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // Thao tác đổi Ảnh đại diện
  const handleEditAvatarPress = () => {
    Alert.alert(
      "Cập nhật ảnh đại diện",
      "Chọn phương thức cập nhật ảnh cá nhân:",
      [
        { text: "Tải ảnh từ điện thoại...", onPress: pickImage },
        { text: "Dùng Emoji mặc định", onPress: removeImage },
        { text: "Hủy", style: "cancel" }
      ]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Quyền truy cập", "Bạn cần cấp quyền truy cập để mở thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsLoading(true);
    try {
      const response = await updateUserAvatar(uri);
      if (response && response.avatar_url) {
        setUserInfo(prev => prev ? { ...prev, avatar: response.avatar_url } : null);
        Alert.alert("Thành công! 🎉", "Ảnh đại diện mới đã được cập nhật.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile(userInfo?.full_name || '', '👨‍🍳');
      setUserInfo(prev => prev ? { ...prev, avatar: '👨‍🍳' } : null);
      Alert.alert("Thành công", "Đã đổi về Emoji mặc định.");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gỡ ảnh đại diện.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert("Lỗi", "Tên hiển thị không được để trống!");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(editFullName, selectedAvatar);
      Alert.alert("Thành công! 🎉", "Hồ sơ của bạn đã được cập nhật.");
      setIsEditModalVisible(false);
      loadProfile();
    } catch (error: any) {
      Alert.alert("Thất bại", "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // Chia sẻ hồ sơ cá nhân
  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Xem hồ sơ ẩm thực của ${userInfo?.full_name} (@${userInfo?.username}) trên FoodAI App nhé! 🍳✨`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleLogout = () => {
    setIsSettingsOpen(false);
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn thoát tài khoản không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logoutUser();
            signOut();
            router.replace('/login');
          }
        }
      ]
    );
  };

  // Theme màu linh hoạt theo Dark Mode
  const dynamicBg = isDarkMode ? '#121212' : '#ffffff';
  const dynamicCardBg = isDarkMode ? '#1e1e1e' : '#f8f9fa';
  const dynamicTextColor = isDarkMode ? '#ffffff' : '#000000';
  const dynamicSubTextColor = isDarkMode ? '#aaaaaa' : '#666666';
  const dynamicBorderColor = isDarkMode ? '#333333' : '#eeeeee';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicBg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={dynamicBg} />

      {/* 1. TOP NAVIGATION BAR (Chuẩn TikTok) */}
      <View style={[styles.topHeader, { borderBottomColor: dynamicBorderColor }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsEditModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color={dynamicTextColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: dynamicTextColor }]} numberOfLines={1}>
            {userInfo?.full_name || 'Gia Kiệt'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={dynamicTextColor} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.rightIconsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSettingsOpen(true)}>
            <Ionicons name="menu-outline" size={28} color={dynamicTextColor} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !userInfo ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fe2c55" />
          <Text style={[styles.loadingText, { color: dynamicSubTextColor }]}>Đang tải trang cá nhân...</Text>
        </View>
      ) : userInfo ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 2. AVATAR & BONG BÓNG TRẠNG THÁI (TikTok Style) */}
          <View style={styles.avatarSection}>
            {/* Status Bubble */}
            <View style={styles.statusBubble}>
              <Text style={styles.statusBubbleText}>{userInfo.status_badge || 'Tám chuyện nào 💬'}</Text>
            </View>

            {/* Avatar Circle */}
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleEditAvatarPress} activeOpacity={0.8}>
              {isUrl(userInfo.avatar) ? (
                <Image source={{ uri: userInfo.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>{userInfo.avatar || '👨‍🍳'}</Text>
              )}
              {/* Plus Story Badge */}
              <View style={styles.plusStoryBadge}>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Username Handle */}
            <Text style={[styles.handleText, { color: dynamicSubTextColor }]}>
              @{userInfo.username}
            </Text>
          </View>

          {/* 3. HÀNG CHỈ SỐ THỐNG KÊ 3 CỘT (TikTok Stats Row) */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
                {userInfo.following_count || 144}
              </Text>
              <Text style={[styles.statLabel, { color: dynamicSubTextColor }]}>Đã follow</Text>
            </TouchableOpacity>

            <View style={[styles.statDivider, { backgroundColor: dynamicBorderColor }]} />

            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
                {userInfo.follower_count > 0 ? userInfo.follower_count.toLocaleString() : '1.686'}
              </Text>
              <Text style={[styles.statLabel, { color: dynamicSubTextColor }]}>Follower</Text>
            </TouchableOpacity>

            <View style={[styles.statDivider, { backgroundColor: dynamicBorderColor }]} />

            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
                {userInfo.total_likes_count > 0 ? userInfo.total_likes_count.toLocaleString() : '322'}
              </Text>
              <Text style={[styles.statLabel, { color: dynamicSubTextColor }]}>Thích</Text>
            </TouchableOpacity>
          </View>

          {/* 4. BIO & NÚT HÀNH ĐỘNG (TikTok Action Pills) */}
          <View style={styles.actionButtonsSection}>
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f1f2f5' }]}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Text style={[styles.actionBtnText, { color: dynamicTextColor }]}>Chỉnh sửa hồ sơ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f1f2f5' }]}
                onPress={handleShareProfile}
              >
                <Text style={[styles.actionBtnText, { color: dynamicTextColor }]}>Chia sẻ hồ sơ</Text>
              </TouchableOpacity>
            </View>

            {/* Bio Pill */}
            <TouchableOpacity
              style={[styles.bioPill, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f8f9fa' }]}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text style={[styles.bioText, { color: dynamicSubTextColor }]}>
                + Thêm tiểu sử  ·  <Text style={{ color: '#fe2c55' }}>♡</Text> {userInfo.bio || 'Yêu bếp & Nấu ăn cùng Food AI...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. HIGHLIGHTS CAROUSEL (Bong bóng Điểm nhấn) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsCarousel}
          >
            <TouchableOpacity style={styles.highlightItem}>
              <View style={[styles.highlightBubble, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f1f2f5' }]}>
                <Ionicons name="add" size={24} color={dynamicTextColor} />
              </View>
              <Text style={[styles.highlightText, { color: dynamicSubTextColor }]}>Mới</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightBubble}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200' }}
                  style={styles.highlightImage}
                />
              </View>
              <Text style={[styles.highlightText, { color: dynamicSubTextColor }]}>Điểm nhấn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightBubble}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                  style={styles.highlightImage}
                />
              </View>
              <Text style={[styles.highlightText, { color: dynamicSubTextColor }]}>Điểm nhấn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightBubble}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200' }}
                  style={styles.highlightImage}
                />
              </View>
              <Text style={[styles.highlightText, { color: dynamicSubTextColor }]}>🎁 Bếp AI</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* 6. HÀNG ICONS TABS (TikTok Multi-Tab Content View) */}
          <View style={[styles.tabBarRow, { borderBottomColor: dynamicBorderColor }]}>
            <TouchableOpacity
              style={[styles.tabIconBtn, activeTab === 'posted' && styles.activeTabLine]}
              onPress={() => setActiveTab('posted')}
            >
              <Ionicons
                name="grid-outline"
                size={22}
                color={activeTab === 'posted' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabIconBtn, activeTab === 'saved' && styles.activeTabLine]}
              onPress={() => setActiveTab('saved')}
            >
              <Ionicons
                name="bookmark-outline"
                size={22}
                color={activeTab === 'saved' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabIconBtn, activeTab === 'liked' && styles.activeTabLine]}
              onPress={() => setActiveTab('liked')}
            >
              <Ionicons
                name="heart-outline"
                size={24}
                color={activeTab === 'liked' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabIconBtn, activeTab === 'private' && styles.activeTabLine]}
              onPress={() => setActiveTab('private')}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={activeTab === 'private' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
              />
            </TouchableOpacity>
          </View>

          {/* 7. HIỂN THỊ NỘI DUNG THEO TAB CHỌN */}

          {/* TAB 1: VIDEO CHÍNH CHỦ ĐÃ ĐĂNG (Lưới 3 cột TikTok) */}
          {activeTab === 'posted' && (
            <View style={styles.gridContainer}>
              {userInfo.my_reels && userInfo.my_reels.length > 0 ? (
                <View style={styles.gridRow}>
                  {userInfo.my_reels.map((reel, idx) => (
                    <TouchableOpacity
                      key={reel.id || idx}
                      style={styles.gridSquare}
                      onPress={() => router.push('/(tabs)/play')}
                    >
                      <Image source={{ uri: reel.posterUrl }} style={styles.gridImage} />
                      <View style={styles.playCountOverlay}>
                        <Ionicons name="play-outline" size={14} color="#fff" style={{ marginRight: 3 }} />
                        <Text style={styles.playCountText}>{reel.viewsCount || 587}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTabState}>
                  <Ionicons name="videocam-outline" size={48} color={dynamicSubTextColor} />
                  <Text style={[styles.emptyStateTitle, { color: dynamicTextColor }]}>Chưa có video nào</Text>
                  <Text style={[styles.emptyStateSub, { color: dynamicSubTextColor }]}>
                    Hãy dùng nút Camera 🎥 ở tab Reels để tạo video nấu ăn đầu tiên của bạn!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: CÔNG THỨC ĐÃ LƯU */}
          {activeTab === 'saved' && (
            <View style={styles.recipesTabContainer}>
              {savedRecipesList.length > 0 ? (
                savedRecipesList.map((item, idx) => (
                  <View key={item.id || idx} style={[styles.recipeCard, { backgroundColor: dynamicCardBg }]}>
                    <Image
                      source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' }}
                      style={styles.recipeImg}
                    />
                    <View style={styles.recipeInfo}>
                      <Text style={[styles.recipeTitle, { color: dynamicTextColor }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.recipeSub, { color: dynamicSubTextColor }]}>
                        {item.time || '15 phút'} · {item.calories || '350 kcal'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#aaa" />
                  </View>
                ))
              ) : (
                <View style={styles.emptyTabState}>
                  <Ionicons name="bookmark-outline" size={48} color={dynamicSubTextColor} />
                  <Text style={[styles.emptyStateTitle, { color: dynamicTextColor }]}>Chưa lưu công thức nào</Text>
                  <Text style={[styles.emptyStateSub, { color: dynamicSubTextColor }]}>
                    Khám phá các món ăn ngon ở Trang chủ và lưu lại tại đây nhé!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: VIDEO ĐÃ THÍCH */}
          {activeTab === 'liked' && (
            <View style={styles.gridContainer}>
              {userInfo.liked_reels && userInfo.liked_reels.length > 0 ? (
                <View style={styles.gridRow}>
                  {userInfo.liked_reels.map((reel, idx) => (
                    <TouchableOpacity
                      key={reel.id || idx}
                      style={styles.gridSquare}
                      onPress={() => router.push('/(tabs)/play')}
                    >
                      <Image source={{ uri: reel.posterUrl }} style={styles.gridImage} />
                      <View style={styles.playCountOverlay}>
                        <Ionicons name="heart" size={13} color="#fe2c55" style={{ marginRight: 3 }} />
                        <Text style={styles.playCountText}>{reel.likesCount || 12}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTabState}>
                  <Ionicons name="heart-dislike-outline" size={48} color={dynamicSubTextColor} />
                  <Text style={[styles.emptyStateTitle, { color: dynamicTextColor }]}>Chưa thả tim video nào</Text>
                  <Text style={[styles.emptyStateSub, { color: dynamicSubTextColor }]}>
                    Các video bạn đã thả tim trên Reels sẽ hiển thị ở đây.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: RIÊNG TƯ */}
          {activeTab === 'private' && (
            <View style={styles.emptyTabState}>
              <Ionicons name="lock-closed-outline" size={48} color={dynamicSubTextColor} />
              <Text style={[styles.emptyStateTitle, { color: dynamicTextColor }]}>Video riêng tư</Text>
              <Text style={[styles.emptyStateSub, { color: dynamicSubTextColor }]}>
                Chỉ có bạn mới xem được các video riêng tư của chính mình.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : null}

      {/* 8. MODAL SETTINGS THANH 3 GẠCH (TikTok Settings Drawer) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSettingsOpen}
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsSettingsOpen(false)}
        >
          <View style={[styles.drawerContainer, { backgroundColor: dynamicBg }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHandleBar} />
              <Text style={[styles.drawerTitle, { color: dynamicTextColor }]}>Cài đặt & Quyền riêng tư ⚙️</Text>
            </View>

            {/* Menu Option 1: Bật/Tắt Dark Mode */}
            <View style={[styles.menuOptionRow, { borderBottomColor: dynamicBorderColor }]}>
              <View style={styles.optionLeft}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color="#fe2c55" style={{ marginRight: 12 }} />
                <Text style={[styles.optionText, { color: dynamicTextColor }]}>Chế độ nền Tối (Dark Mode)</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={(val) => setIsDarkMode(val)}
                trackColor={{ false: '#ddd', true: '#fe2c55' }}
                thumbColor="#fff"
              />
            </View>

            {/* Menu Option 2: Chỉnh sửa hồ sơ */}
            <TouchableOpacity
              style={[styles.menuOptionRow, { borderBottomColor: dynamicBorderColor }]}
              onPress={() => {
                setIsSettingsOpen(false);
                setIsEditModalVisible(true);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="person-outline" size={22} color="#28a745" style={{ marginRight: 12 }} />
                <Text style={[styles.optionText, { color: dynamicTextColor }]}>Chỉnh sửa hồ sơ cá nhân</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#aaa" />
            </TouchableOpacity>

            {/* Menu Option 3: Thông tin ứng dụng */}
            <View style={[styles.menuOptionRow, { borderBottomColor: dynamicBorderColor }]}>
              <View style={styles.optionLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#007bff" style={{ marginRight: 12 }} />
                <Text style={[styles.optionText, { color: dynamicTextColor }]}>Phiên bản ứng dụng (v1.0.0)</Text>
              </View>
              <Text style={{ color: dynamicSubTextColor, fontSize: 13 }}>FoodAI App</Text>
            </View>

            {/* Menu Option 4: Đăng xuất */}
            <TouchableOpacity style={styles.logoutRowBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#dc3545" style={{ marginRight: 12 }} />
              <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 9. MODAL CHỈNH SỬA HỒ SƠ CÁ NHÂN */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.editModalContent, { backgroundColor: dynamicBg }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: dynamicTextColor }]}>Chỉnh Sửa Hồ Sơ ✏️</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={dynamicSubTextColor} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: dynamicSubTextColor }]}>Tên hiển thị:</Text>
              <TextInput
                style={[styles.textInput, { color: dynamicTextColor, borderColor: dynamicBorderColor }]}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập tên hiển thị mới..."
                placeholderTextColor="#aaa"
              />

              <Text style={[styles.fieldLabel, { color: dynamicSubTextColor, marginTop: 15 }]}>Chọn Emoji đại diện:</Text>
              <View style={styles.emojiRow}>
                {EMOJI_LIST.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiChip,
                      selectedAvatar === emoji && styles.emojiChipSelected,
                    ]}
                    onPress={() => setSelectedAvatar(emoji)}
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  // Top Navigation Bar
  topHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  rightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginTop: 15,
  },
  statusBubble: {
    backgroundColor: '#f1f2f5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusBubbleText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEmoji: {
    fontSize: 54,
  },
  plusStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#00b2ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  handleText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '400',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
  },
  // Action Buttons & Bio
  actionButtonsSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bioPill: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bioText: {
    fontSize: 13,
  },
  // Highlights Carousel
  highlightsCarousel: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 16,
    paddingBottom: 10,
  },
  highlightItem: {
    alignItems: 'center',
  },
  highlightBubble: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  highlightImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  highlightText: {
    fontSize: 11,
    marginTop: 4,
  },
  // Tab Bar Row
  tabBarRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginTop: 10,
  },
  tabIconBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  // Grid 3 Cột (TikTok Video Grid)
  gridContainer: {
    flex: 1,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridSquare: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH * 1.35,
    backgroundColor: '#eee',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  playCountOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 3,
  },
  emptyTabState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  // Recipes Tab
  recipesTabContainer: {
    padding: 16,
    gap: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  recipeImg: {
    width: 54,
    height: 54,
    borderRadius: 8,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  recipeSub: {
    fontSize: 12,
    marginTop: 4,
  },
  // Drawer / Bottom Sheet Settings
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  drawerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  drawerHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  logoutRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc3545',
  },
  // Edit Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  editModalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  emojiChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiChipSelected: {
    backgroundColor: '#ffe5eb',
    borderWidth: 1.5,
    borderColor: '#fe2c55',
  },
  saveBtn: {
    backgroundColor: '#fe2c55',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});