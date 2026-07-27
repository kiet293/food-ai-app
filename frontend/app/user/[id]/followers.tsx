import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchUserFollowers,
  fetchUserFollowing,
  followUser,
  unfollowUser,
  FollowListItem,
} from '@/services/community/communityService';

type TabKey = 'followers' | 'following';

interface TabState {
  items: FollowListItem[];
  page: number;
  hasMore: boolean;
  total: number;
  loading: boolean;
  loaded: boolean;
}

const EMPTY_TAB_STATE: TabState = { items: [], page: 1, hasMore: true, total: 0, loading: false, loaded: false };
const PAGE_SIZE = 20;

export default function FollowListScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string; handle?: string; tab?: string }>();
  const router = useRouter();
  const userId = params.id as string;
  const initialTab: TabKey = params.tab === 'following' ? 'following' : 'followers';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [followersState, setFollowersState] = useState<TabState>(EMPTY_TAB_STATE);
  const [followingState, setFollowingState] = useState<TabState>(EMPTY_TAB_STATE);

  const getState = (tab: TabKey) => (tab === 'followers' ? followersState : followingState);
  const setState = (tab: TabKey, updater: (prev: TabState) => TabState) => {
    if (tab === 'followers') {
      setFollowersState(updater);
    } else {
      setFollowingState(updater);
    }
  };

  const loadTab = useCallback(async (tab: TabKey, reset: boolean) => {
    const current = getState(tab);
    if (current.loading) return;
    if (!reset && !current.hasMore) return;

    setState(tab, (prev) => ({ ...prev, loading: true }));

    const nextPage = reset ? 1 : current.page;
    const fetcher = tab === 'followers' ? fetchUserFollowers : fetchUserFollowing;
    const response = await fetcher(userId, nextPage, PAGE_SIZE);

    setState(tab, (prev) => ({
      items: reset ? response.items : [...prev.items, ...response.items],
      page: nextPage + 1,
      hasMore: nextPage < response.pagination.total_pages,
      total: response.pagination.total_items,
      loading: false,
      loaded: true,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, followersState.loading, followingState.loading]);

  useEffect(() => {
    if (!getState(activeTab).loaded) {
      loadTab(activeTab, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleToggleFollow = async (tab: TabKey, item: FollowListItem) => {
    const targetId = parseInt(item.id, 10);
    if (isNaN(targetId)) return;

    const previousFollowing = item.is_following;

    setState(tab, (prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === item.id ? { ...it, is_following: !previousFollowing } : it)),
    }));

    try {
      if (previousFollowing) {
        await unfollowUser(targetId);
      } else {
        await followUser(targetId);
      }
    } catch (err: any) {
      setState(tab, (prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === item.id ? { ...it, is_following: previousFollowing } : it)),
      }));
      Alert.alert('Thao tác thất bại', err.message || 'Bạn cần đăng nhập để theo dõi người dùng này.');
    }
  };

  const renderItem = ({ item }: { item: FollowListItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.id } })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowHandle} numberOfLines={1}>{item.handle}</Text>
      </View>
      {!item.is_self && (
        <TouchableOpacity
          style={[styles.followBtn, item.is_following && styles.followingBtn]}
          onPress={() => handleToggleFollow(activeTab, item)}
        >
          <Text style={[styles.followBtnText, item.is_following && styles.followingBtnText]}>
            {item.is_following ? 'Đang theo dõi' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const state = getState(activeTab);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{params.name || params.handle || 'Người dùng'}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('following')}>
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Đã follow {followingState.loaded ? followingState.total : ''}
          </Text>
          {activeTab === 'following' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('followers')}>
          <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
            Follower {followersState.loaded ? followersState.total : ''}
          </Text>
          {activeTab === 'followers' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={state.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={() => loadTab(activeTab, false)}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          state.loading ? null : (
            <Text style={styles.emptyText}>
              {activeTab === 'followers' ? 'Chưa có ai theo dõi' : 'Chưa follow ai'}
            </Text>
          )
        }
        ListFooterComponent={
          state.loading ? <ActivityIndicator size="small" color="#FF5A5F" style={{ marginVertical: 20 }} /> : null
        }
      />
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
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  tabUnderline: {
    marginTop: 8,
    height: 2,
    width: 36,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  rowHandle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  followingBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FF5A5F',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  followingBtnText: {
    color: '#FF5A5F',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 60,
  },
});
