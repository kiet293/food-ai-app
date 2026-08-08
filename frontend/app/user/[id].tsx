import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,  TouchableOpacity, ScrollView, Image, StatusBar, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUserProfile, UserProfileInfo } from '../../services/user/userService';
import { followUser, unfollowUser } from '../../services/community/communityService';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

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
    if (!id || followLoading) return;

    const userId = parseInt(id as string, 10);
    if (isNaN(userId)) return;

    // Optimistic update: đổi giao diện ngay, rollback nếu API lỗi
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
      Alert.alert('Thao tác thất bại', err.message || 'Bạn cần đăng nhập để theo dõi người dùng này.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#FF5A5F" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile.avatar }}
            style={styles.avatar}
          />
          <View style={styles.infoBlock}>
            <Text style={styles.name}>{profile.name.toUpperCase()}</Text>
            <Text style={styles.handle}>{profile.handle}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>made</Text>
                <Text style={styles.statValue}>{profile.made_count}</Text>
              </View>
              <View style={[styles.statItem, styles.statBorder]}>
                <Text style={styles.statLabel}>want to make</Text>
                <Text style={styles.statValue}>{profile.want_to_make_count}</Text>
              </View>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({
                  pathname: '/user/[id]/followers',
                  params: { id: id as string, name: profile.name, handle: profile.handle, tab: 'followers' },
                })}
              >
                <Text style={styles.statLabel}>followers</Text>
                <Text style={styles.statValue}>{followerCount}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Follow Button */}
        {!profile.is_self && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleToggleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? '#FF5A5F' : '#fff'} />
            ) : (
              <>
                {isFollowing && <Ionicons name="checkmark" size={16} color="#FF5A5F" style={{ marginRight: 4 }} />}
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Đang theo dõi' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Section: RECENTLY ADDED */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>RECENTLY ADDED</Text>
          {profile.recent_recipes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {profile.recent_recipes.map((recipe, index) => (
                <TouchableOpacity
                  key={`recipe-${recipe.id}-${index}`}
                  style={styles.recentCard}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                >
                  <Image source={{ uri: recipe.image }} style={styles.recentImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.recentGradient}
                  >
                    <Text style={styles.recentTitle} numberOfLines={2}>{recipe.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ paddingHorizontal: 20, color: '#888' }}>Chưa có món ăn nào.</Text>
          )}
        </View>

        {/* Section: COLLECTIONS */}
        <View style={[styles.sectionContainer, { paddingBottom: 40 }]}>
          <Text style={styles.sectionTitle}>COLLECTIONS</Text>
          <View style={styles.collectionsList}>
            {profile.collections.length > 0 ? profile.collections.map((collection, index) => (
              <TouchableOpacity key={`collection-${collection.id}-${index}`} style={styles.collectionCard}>
                <Image source={{ uri: collection.image }} style={styles.collectionImage} />
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionTitle}>{collection.title.toUpperCase()}</Text>
                  <Text style={styles.collectionSubtitle}>{collection.count} recipes</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" style={styles.collectionChevron} />
              </TouchableOpacity>
            )) : (
              <Text style={{ color: '#888' }}>Chưa có bộ sưu tập nào.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    padding: 8,
    marginLeft: 8,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8, // Kéo lệch sang trái một chút để cân bằng
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 16,
  },
  infoBlock: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  handle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'lowercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginTop: 2,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5A5F',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 16,
    minWidth: 100,
  },
  followingBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FF5A5F',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  followingBtnText: {
    color: '#FF5A5F',
  },
  sectionContainer: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
  },
  recentCard: {
    width: 130,
    height: 160,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  recentImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  recentGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 10,
  },
  recentTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  collectionsList: {
    paddingHorizontal: 20,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  collectionImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  collectionInfo: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  collectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  collectionSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  collectionChevron: {
    paddingHorizontal: 16,
  },
});
