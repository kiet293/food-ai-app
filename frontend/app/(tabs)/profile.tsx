import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import {

  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { getUserProfile, logoutUser, updateUserProfile, updateUserAvatar } from '@/services/auth/authService';
import { getSavedRecipes } from '@/services/recipe/recipeService';
import { useAuth } from '../_layout';

// Import sub-components từ package components/profile/
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAvatarSection } from '@/components/profile/ProfileAvatarSection';
import { ProfileStatsRow } from '@/components/profile/ProfileStatsRow';
import { ProfileActionButtons } from '@/components/profile/ProfileActionButtons';
import { ProfileRecentlyAdded } from '@/components/profile/ProfileRecentlyAdded';
import { ProfileTabBar, ProfileTabType } from '@/components/profile/ProfileTabBar';
import { ProfileVideoGrid } from '@/components/profile/ProfileVideoGrid';
import { ProfileSettingsDrawer } from '@/components/profile/ProfileSettingsDrawer';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { ProfileBioModal } from '@/components/profile/ProfileBioModal';

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
  recent_recipes?: any[];
  joined_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [userInfo, setUserInfo] = useState<ProfileUserData | null>(null);
  const [savedRecipesList, setSavedRecipesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab đang chọn: 'posted' | 'saved' | 'liked' | 'private'
  const [activeTab, setActiveTab] = useState<ProfileTabType>('posted');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal Hamburger Settings (Nút 3 gạch)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal Sửa hồ sơ cá nhân (TikTok Edit Profile Screen)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Chỉnh sửa Tiểu sử (TikTok Bio Modal)
  const [isBioModalVisible, setIsBioModalVisible] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Lấy dữ liệu hồ sơ từ Backend
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      console.log("ProfileScreen loaded profile data:", data);
      if (data) {
        setUserInfo(data);
      }

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

  // Chọn ảnh thật từ điện thoại
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Quyền truy cập", "Bạn cần cấp quyền truy cập để mở thư viện ảnh!");
      return;
    }

    // Thay đổi avatar
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

  // Chọn Emoji đại diện thay thế
  const handleSelectEmojiAvatar = async (emoji: string) => {
    setIsLoading(true);
    try {
      await updateUserProfile(undefined, emoji);
      setUserInfo(prev => prev ? { ...prev, avatar: emoji } : null);
      Alert.alert("Thành công! 🎉", `Đã đổi đại diện sang Emoji ${emoji}`);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gỡ ảnh đại diện.");
    } finally {
      setIsLoading(false);
    }
  };

  // Đổi Tên hiển thị
  const handleSaveFullNameOnly = async (newName: string) => {
    setIsSaving(true);
    try {
      await updateUserProfile(newName);
      setUserInfo(prev => prev ? { ...prev, full_name: newName } : null);
      Alert.alert("Thành công! 🎉", "Tên hiển thị mới đã được lưu.");
    } catch (error) {
      Alert.alert("Thất bại", "Không thể lưu tên hiển thị.");
    } finally {
      setIsSaving(false);
    }
  };

  // Lưu hoặc Xóa Tiểu sử thực tế
  const handleSaveBio = async (newBioText: string) => {
    setIsSavingBio(true);
    try {
      await updateUserProfile(undefined, undefined, newBioText);
      setUserInfo(prev => prev ? { ...prev, bio: newBioText } : null);
      setIsBioModalVisible(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu tiểu sử. Vui lòng thử lại.");
    } finally {
      setIsSavingBio(false);
    }
  };

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

  // Theme linh hoạt theo Dark Mode
  const dynamicBg = isDarkMode ? '#121212' : '#ffffff';
  const dynamicCardBg = isDarkMode ? '#1e1e1e' : '#f8f9fa';
  const dynamicTextColor = isDarkMode ? '#ffffff' : '#000000';
  const dynamicSubTextColor = isDarkMode ? '#aaaaaa' : '#666666';
  const dynamicBorderColor = isDarkMode ? '#333333' : '#eeeeee';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicBg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={dynamicBg} />

      {/* 1. Header Navigation */}
      <ProfileHeader
        fullName={userInfo?.full_name || 'Gia Kiệt'}
        dynamicTextColor={dynamicTextColor}
        dynamicBorderColor={dynamicBorderColor}
        onOpenEditModal={() => setIsEditModalVisible(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {isLoading && !userInfo ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fe2c55" />
          <Text style={[styles.loadingText, { color: dynamicSubTextColor }]}>Đang tải trang cá nhân...</Text>
        </View>
      ) : userInfo ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 2. Avatar & Status */}
          <ProfileAvatarSection
            avatar={userInfo.avatar}
            username={userInfo.username}
            statusBadge={userInfo.status_badge}
            dynamicSubTextColor={dynamicSubTextColor}
            onEditAvatarPress={() => setIsEditModalVisible(true)}
          />

          {/* 3. Stats Row (Hiển thị chỉ số thực từ Database) */}
          <ProfileStatsRow
            followingCount={userInfo.following_count}
            followerCount={userInfo.follower_count}
            totalLikesCount={userInfo.total_likes_count}
            dynamicTextColor={dynamicTextColor}
            dynamicSubTextColor={dynamicSubTextColor}
            dynamicBorderColor={dynamicBorderColor}
            onPressFollowing={() => router.push({
              pathname: '/user/[id]/followers',
              params: { id: String(userInfo.id), name: userInfo.full_name, handle: '@' + userInfo.username, tab: 'following' }
            })}
            onPressFollowers={() => router.push({
              pathname: '/user/[id]/followers',
              params: { id: String(userInfo.id), name: userInfo.full_name, handle: '@' + userInfo.username, tab: 'followers' }
            })}
          />

          {/* 4. Action Buttons & Bio (TikTok Style) */}
          <ProfileActionButtons
            bio={userInfo.bio}
            isDarkMode={isDarkMode}
            dynamicTextColor={dynamicTextColor}
            dynamicSubTextColor={dynamicSubTextColor}
            onOpenEditModal={() => setIsEditModalVisible(true)}
            onOpenBioModal={() => setIsBioModalVisible(true)}
            onShareProfile={handleShareProfile}
          />

          {/* 5. Section Bài viết mới thêm (Recently Added Carousel) */}
          <ProfileRecentlyAdded
            recipes={savedRecipesList || []}
            isDarkMode={isDarkMode}
            dynamicTextColor={dynamicTextColor}
            dynamicSubTextColor={dynamicSubTextColor}
            onPressRecipe={(id) => {
              if (typeof id === 'string' && id.startsWith('rec-')) {
                Alert.alert("Dữ liệu mẫu", "Đây là bài viết mẫu để trang trí, không có sẵn chi tiết.");
                return;
              }
              router.push(`/recipe/${id}`);
            }}
          />

          {/* 6. Multi-Tab Bar */}
          <ProfileTabBar
            activeTab={activeTab}
            isDarkMode={isDarkMode}
            dynamicBorderColor={dynamicBorderColor}
            onTabChange={(tab) => setActiveTab(tab)}
          />

          {/* 7. Grid Nội Dung Video & Công Thức */}
          <ProfileVideoGrid
            activeTab={activeTab}
            reelsList={userInfo.my_reels}
            savedRecipesList={savedRecipesList}
            likedReelsList={userInfo.liked_reels}
            dynamicTextColor={dynamicTextColor}
            dynamicSubTextColor={dynamicSubTextColor}
            dynamicCardBg={dynamicCardBg}
            onNavigateToPlay={(reelId) => router.push({ pathname: '/(tabs)/play', params: { reelId } })}
          />
        </ScrollView>
      ) : null}

      {/* 8. Settings Drawer Modal */}
      <ProfileSettingsDrawer
        visible={isSettingsOpen}
        isDarkMode={isDarkMode}
        dynamicBg={dynamicBg}
        dynamicTextColor={dynamicTextColor}
        dynamicSubTextColor={dynamicSubTextColor}
        dynamicBorderColor={dynamicBorderColor}
        onClose={() => setIsSettingsOpen(false)}
        onToggleDarkMode={(val) => setIsDarkMode(val)}
        onOpenEditModal={() => setIsEditModalVisible(true)}
        onLogout={handleLogout}
      />

      {/* 9. TikTok Edit Profile Screen Modal */}
      <ProfileEditModal
        visible={isEditModalVisible}
        fullName={userInfo?.full_name || ''}
        username={userInfo?.username || ''}
        avatar={userInfo?.avatar || '👨‍🍳'}
        bio={userInfo?.bio}
        isSaving={isSaving}
        isDarkMode={isDarkMode}
        dynamicBg={dynamicBg}
        dynamicTextColor={dynamicTextColor}
        dynamicSubTextColor={dynamicSubTextColor}
        dynamicBorderColor={dynamicBorderColor}
        onClose={() => setIsEditModalVisible(false)}
        onPickImage={pickImage}
        onSelectEmoji={handleSelectEmojiAvatar}
        onSaveFullName={handleSaveFullNameOnly}
        onOpenBioModal={() => setIsBioModalVisible(true)}
      />

      {/* 10. TikTok Edit Bio Modal */}
      <ProfileBioModal
        visible={isBioModalVisible}
        initialBio={userInfo?.bio || ''}
        isSaving={isSavingBio}
        isDarkMode={isDarkMode}
        dynamicBg={dynamicBg}
        dynamicTextColor={dynamicTextColor}
        dynamicSubTextColor={dynamicSubTextColor}
        dynamicBorderColor={dynamicBorderColor}
        onClose={() => setIsBioModalVisible(false)}
        onSaveBio={handleSaveBio}
      />
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
});