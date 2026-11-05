import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { fetchUserProfile, UserProfileInfo } from '../../services/user/userService';
import { followUser, unfollowUser } from '../../services/community/communityService';

// Import sub-components từ package components/profile/
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAvatarSection } from '@/components/profile/ProfileAvatarSection';
import { ProfileStatsRow } from '@/components/profile/ProfileStatsRow';
import { ProfileActionButtons } from '@/components/profile/ProfileActionButtons';
import { ProfileRecentlyAdded } from '@/components/profile/ProfileRecentlyAdded';
import { ProfileTabBar, ProfileTabType } from '@/components/profile/ProfileTabBar';
import { ProfileVideoGrid } from '@/components/profile/ProfileVideoGrid';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<ProfileTabType>('posted');
  const isDarkMode = false; // Mặc định sáng cho đồng nhất

  const dynamicBg = '#ffffff';
  const dynamicCardBg = '#f8f9fa';
  const dynamicTextColor = '#000000';
  const dynamicSubTextColor = '#666666';
  const dynamicBorderColor = '#eeeeee';

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      const data = await fetchUserProfile(id as string);
      setProfile(data);
      if (data) {
        setIsFollowing(data.is_following);
        setFollowerCount(data.follower_count);
      }
      setLoading(false);
    };
    loadProfile();
  }, [id]);

  const handleToggleFollow = async () => {
    if (!id || followLoading || !profile) return;

    const rawId = String(id).replace(/^user-/, '');
    const userId = parseInt(rawId, 10);
    if (isNaN(userId)) return;

    const previousFollowing = isFollowing;
    const previousCount = followerCount;
    setIsFollowing(!previousFollowing);
    setFollowerCount(previousFollowing ? previousCount - 1 : previousCount + 1);
    setFollowLoading(true);

    try {
      if (previousFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (err: any) {
      setIsFollowing(previousFollowing);
      setFollowerCount(previousCount);
      Alert.alert('Thao tác thất bại', err.message || 'Bạn cần đăng nhập để thực hiện thao tác này.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fe2c55" />
          <Text style={[styles.loadingText, { color: dynamicSubTextColor }]}>Đang tải trang cá nhân...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ProfileHeader
          fullName="Không tìm thấy"
          dynamicTextColor={dynamicTextColor}
          dynamicBorderColor={dynamicBorderColor}
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.centerContainer}>
          <Text style={{ textAlign: 'center' }}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={dynamicBg} />

      <ProfileHeader
        fullName={profile.name}
        dynamicTextColor={dynamicTextColor}
        dynamicBorderColor={dynamicBorderColor}
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar & Tên */}
        <ProfileAvatarSection
          avatar={profile.avatar}
          username={profile.handle.replace('@', '')}
          statusBadge={profile.is_self ? "Tám chuyện nào 💬" : undefined}
          dynamicSubTextColor={dynamicSubTextColor}
        />

        {/* Stats Row */}
        <ProfileStatsRow
          followingCount={profile.following_count || 0}
          followerCount={followerCount}
          totalLikesCount={profile.total_likes_count || 0}
          dynamicTextColor={dynamicTextColor}
          dynamicSubTextColor={dynamicSubTextColor}
          dynamicBorderColor={dynamicBorderColor}
          onPressFollowing={() => router.push(`/user/${String(id).replace(/^user-/, '')}/followers?tab=following`)}
          onPressFollowers={() => router.push(`/user/${String(id).replace(/^user-/, '')}/followers?tab=followers`)}
        />

        {/* Action Buttons */}
        <ProfileActionButtons
          isSelfProfile={profile.is_self}
          isFollowing={isFollowing}
          onToggleFollow={handleToggleFollow}
          isDarkMode={isDarkMode}
          dynamicTextColor={dynamicTextColor}
          dynamicSubTextColor={dynamicSubTextColor}
          bio={profile.bio || ""}
        />

        {/* Bài viết mới thêm */}
        {profile.recent_recipes && profile.recent_recipes.length > 0 && (
          <ProfileRecentlyAdded
            recipes={profile.recent_recipes.map(r => ({ ...r, title: r.title, image: r.image }))}
            isDarkMode={isDarkMode}
            dynamicTextColor={dynamicTextColor}
            dynamicSubTextColor={dynamicSubTextColor}
            onPressRecipe={(recipeId) => {
              if (typeof recipeId === 'string' && recipeId.startsWith('rec-')) {
                Alert.alert("Dữ liệu mẫu", "Đây là bài viết mẫu để trang trí, không có sẵn chi tiết.");
                return;
              }
              router.push(`/recipe/${recipeId}`);
            }}
          />
        )}

        {/* Tab Bar */}
        <ProfileTabBar
          activeTab={activeTab}
          isDarkMode={isDarkMode}
          dynamicBorderColor={dynamicBorderColor}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Video Grid */}
        <ProfileVideoGrid
          activeTab={activeTab}
          reelsList={profile.my_reels || []}
          savedRecipesList={profile.collections || []}
          likedReelsList={profile.liked_reels || []}
          dynamicTextColor={dynamicTextColor}
          dynamicSubTextColor={dynamicSubTextColor}
          dynamicCardBg={dynamicCardBg}
          onNavigateToPlay={(reelId) => router.push({ pathname: '/play', params: { reelId } })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
});
