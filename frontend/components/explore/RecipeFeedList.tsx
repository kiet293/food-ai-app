import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExploreFeedItem, ExploreFeedResponse } from '@/services/recipe/recipeService';
import { favoriteRecipe, unfavoriteRecipe, followUser, unfollowUser } from '@/services/community/communityService';
import { SaveToCollectionModal } from '@/components/collections/SaveToCollectionModal';
import { SharePostModal } from '@/components/community/SharePostModal';
import { getWsBaseUrl } from '@/services/shared/apiConfig';

const { width } = Dimensions.get('window');

interface RecipeFeedListProps {
  fetchData: (startId: number | null, limit: number, tag: string | null) => Promise<ExploreFeedResponse>;
  initialStartId?: number | null;
  ListHeaderComponent?: React.ReactElement | null;
  onTagChange?: (tag: string | null) => void;
}

export const RecipeFeedList: React.FC<RecipeFeedListProps> = ({
  fetchData,
  initialStartId = null,
  ListHeaderComponent,
  onTagChange
}) => {
  const router = useRouter();

  const [data, setData] = useState<ExploreFeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedRecipeForCollection, setSelectedRecipeForCollection] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activePostForModal, setActivePostForModal] = useState<ExploreFeedItem | null>(null);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'recipeSavedStateChanged',
      (event: { recipeId: number; isSaved: boolean }) => {
        setData((prevData) =>
          prevData.map((item) => {
            if (item.id === event.recipeId) {
              return { ...item, is_in_collection: event.isSaved };
            }
            return item;
          })
        );
      }
    );

    const wsUrl = `${getWsBaseUrl()}/feed`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Connected to GLOBAL_FEED WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TYM_UPDATE') {
          setData((prev) =>
            prev.map((item) =>
              item.id === msg.recipe_id
                ? { ...item, favorites_count: msg.favorites_count }
                : item
            )
          );
        } else if (msg.type === 'COMMENT_UPDATE') {
          setData((prev) =>
            prev.map((item) =>
              item.id === msg.recipe_id
                ? { ...item, comments_count: msg.comments_count }
                : item
            )
          );
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    };

    return () => {
      subscription.remove();
      ws.close();
    };
  }, []);

  const handleToggleFollow = async (item: ExploreFeedItem) => {
    if (!item.author) return;
    const authorId = item.author.id;
    const previousFollowing = item.author.is_following;

    // Cập nhật giao diện lập tức (Optimistic update) cho tất cả bài viết của tác giả này trong danh sách
    setData(prev => prev.map(r => r.author?.id === authorId
      ? { ...r, author: { ...r.author, is_following: !previousFollowing } }
      : r
    ));

    try {
      if (previousFollowing) {
        await unfollowUser(authorId);
      } else {
        await followUser(authorId);
      }
    } catch (err: any) {
      // Hoàn tác nếu gặp lỗi
      setData(prev => prev.map(r => r.author?.id === authorId
        ? { ...r, author: { ...r.author, is_following: previousFollowing } }
        : r
      ));
      Alert.alert('Thao tác thất bại', err.message || 'Có lỗi xảy ra khi thực hiện theo dõi.');
    }
  };

  const handleToggleFavorite = async (item: ExploreFeedItem) => {
    const previousFavorited = item.is_favorited;
    const previousCount = item.favorites_count;

    // Optimistic update
    setData(prev => prev.map(r => r.id === item.id
      ? { ...r, is_favorited: !previousFavorited, favorites_count: previousFavorited ? previousCount - 1 : previousCount + 1 }
      : r
    ));

    try {
      if (previousFavorited) {
        await unfavoriteRecipe(item.id);
      } else {
        await favoriteRecipe(item.id);
      }
    } catch (err: any) {
      setData(prev => prev.map(r => r.id === item.id
        ? { ...r, is_favorited: previousFavorited, favorites_count: previousCount }
        : r
      ));
      Alert.alert('Thao tác thất bại', err.message || 'Bạn cần đăng nhập để yêu thích công thức này.');
    }
  };

  const loadData = async (isLoadMore = false) => {
    if (isLoading || (!hasMore && isLoadMore)) return;

    setIsLoading(true);

    let startId = isLoadMore ? cursor : initialStartId;

    if (tagFilter && !isLoadMore) {
      startId = null;
    }

    if (!startId && !isLoadMore && !tagFilter && initialStartId !== null) {
      // Logic for explore-detail to only load if it has startId or tagFilter
      // If initialStartId is intentionally null (like in Following feed), it's okay to fetch.
      if (initialStartId) {
        setIsLoading(false);
        return;
      }
    }

    const response = await fetchData(startId, 5, tagFilter);

    if (isLoadMore) {
      setData(prev => [...prev, ...response.items]);
    } else {
      setData(response.items);
      setIsFirstLoad(false);
    }

    if (response.next_cursor !== null && response.next_cursor !== undefined) {
      setCursor(response.next_cursor);
    } else {
      setHasMore(false);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData(false);
  }, [initialStartId, tagFilter]);

  // Handle Tag change callback for parent
  useEffect(() => {
    if (onTagChange) {
      onTagChange(tagFilter);
    }
  }, [tagFilter]);

  useEffect(() => {
    const backAction = () => {
      if (tagFilter) {
        setTagFilter(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [tagFilter]);

  const renderDescriptionWithTags = (text: string) => {
    if (!text) return null;

    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('#')) {
        const cleanWord = word.trim();
        return (
          <Text
            key={index}
            style={styles.hashtag}
            onPress={() => setTagFilter(cleanWord)}
          >
            {word}
          </Text>
        );
      }
      return <Text key={index}>{word}</Text>;
    });
  };

  const renderItem = ({ item }: { item: ExploreFeedItem }) => {
    return (
      <View style={styles.cardContainer}>
        {/* AUTHOR HEADER */}
        <View style={styles.authorHeader}>
          <TouchableOpacity
            style={styles.authorInfoLeft}
            activeOpacity={0.7}
            onPress={() => router.push(`/user/${item.author?.id}` as any)}
          >
            {item.author?.avatar ? (
              <Image source={{ uri: item.author.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.author?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View style={styles.authorTextContainer}>
              <Text style={styles.authorName}>{item.author?.name || 'Đầu bếp'}</Text>
              <Text style={styles.authorHandle}>{item.author?.handle || '@user'}</Text>
            </View>
          </TouchableOpacity>

          {!item.author?.is_self && (
            <TouchableOpacity
              style={[
                styles.followButton,
                item.author?.is_following && styles.followingButton
              ]}
              onPress={() => handleToggleFollow(item)}
            >
              <Text style={[
                styles.followButtonText,
                item.author?.is_following && styles.followingButtonText
              ]}>
                {item.author?.is_following ? 'Đang follow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* MAIN RECIPE CARD (IMAGE) */}
        <TouchableOpacity
          style={styles.imageCard}
          activeOpacity={0.95}
          onPress={() => router.push(`/recipe/${item.id}` as any)}
        >
          <Image source={{ uri: item.image }} style={styles.recipeImage} />
          {/* Subtle gradient overlay at bottom for title readability */}
          <View style={styles.imageGradientOverlay} />
        </TouchableOpacity>

        {/* DETAILS SECTION */}
        <View style={styles.detailsSection}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/recipe/${item.id}` as any)}
          >
            <Text style={styles.recipeTitle}>{item.title}</Text>
          </TouchableOpacity>

          {/* RATING & STATS PILL BADGES */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#FF9500" />
              <Text style={styles.ratingBadgeText}>
                {item.ratings_count > 0 ? `${item.ratings_avg.toFixed(1)} (${item.ratings_count} đánh giá)` : "Chưa có đánh giá"}
              </Text>
            </View>
          </View>

          {/* DESCRIPTION */}
          {item.description ? (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                {renderDescriptionWithTags(item.description)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* INSTAGRAM-STYLE ACTION BAR */}
        <View style={styles.actionBar}>
          <View style={styles.actionBarLeft}>
            {/* LIKE */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => handleToggleFavorite(item)}
            >
              <Ionicons
                name={item.is_favorited ? "heart" : "heart-outline"}
                size={26}
                color={item.is_favorited ? "#fe2c55" : "#1e293b"}
              />
              <Text style={[styles.actionBtnLabel, item.is_favorited && styles.likedLabel]}>
                {item.favorites_count || 0}
              </Text>
            </TouchableOpacity>

            {/* COMMENT */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => router.push(`/recipe/${item.id}?tab=comments` as any)}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#1e293b" />
              <Text style={styles.actionBtnLabel}>{item.comments_count || 0}</Text>
            </TouchableOpacity>

            {/* SHARE */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => {
                setActivePostForModal(item);
                setIsShareModalOpen(true);
              }}
            >
              <Ionicons name="paper-plane-outline" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* BOOKMARK (SAVE) */}
          <TouchableOpacity
            style={styles.bookmarkBtn}
            activeOpacity={0.7}
            onPress={() => setSelectedRecipeForCollection(item.id)}
          >
            <Ionicons
              name={item.is_in_collection ? "bookmark" : "bookmark-outline"}
              size={24}
              color={item.is_in_collection ? "#fe2c55" : "#1e293b"}
            />
          </TouchableOpacity>
        </View>

        {/* BOTTOM POST SEPARATOR */}
        <View style={styles.cardSeparator} />
      </View>
    );
  };

  if (isFirstLoad) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => `post-${item.id}`}
        renderItem={renderItem}
        onEndReached={() => loadData(true)}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.feedScroll}
        ListHeaderComponent={ListHeaderComponent ?? undefined}
        ListFooterComponent={
          isLoading && !isFirstLoad ? (
            <ActivityIndicator size="small" color="#28a745" style={{ margin: 20 }} />
          ) : undefined
        }
      />

      <SharePostModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postTitle={activePostForModal?.title}
        recipeId={activePostForModal?.id}
      />

      <SaveToCollectionModal
        visible={selectedRecipeForCollection !== null}
        onClose={() => setSelectedRecipeForCollection(null)}
        recipeId={selectedRecipeForCollection || 0}
        onSavedChange={(isSaved) => {
          setData(prev => prev.map(r => r.id === selectedRecipeForCollection ? { ...r, is_in_collection: isSaved } : r));
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  feedScroll: {
    paddingBottom: 40,
  },
  // ─── CARD CONTAINER ────────────────────────────────────────────
  cardContainer: {
    backgroundColor: '#fff',
    marginBottom: 0,
  },
  // ─── AUTHOR HEADER ────────────────────────────────────────────
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  authorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e8f5e9',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorTextContainer: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2e1a',
    marginBottom: 1,
  },
  authorHandle: {
    fontSize: 12,
    color: '#78909c',
  },
  followButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  followingButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followingButtonText: {
    color: '#6b7280',
  },
  // ─── IMAGE CARD ───────────────────────────────────────────────
  imageCard: {
    width: width - 24,
    height: (width - 24) * 0.72,
    borderRadius: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#e8f5e9',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  // ─── DETAILS SECTION ─────────────────────────────────────────
  detailsSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  recipeTitle: {
    color: '#1a2e1a',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingBadgeText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#546e7a',
    lineHeight: 20,
  },
  hashtag: {
    color: '#28a745',
    fontWeight: '700',
  },
  // ─── ACTION BAR ───────────────────────────────────────────────
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    marginTop: 4,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnLabel: {
    fontSize: 13,
    color: '#455a64',
    fontWeight: '600',
    marginLeft: 5,
  },
  likedLabel: {
    color: '#e53935',
  },
  bookmarkBtn: {
    padding: 2,
  },
  // ─── SEPARATOR ────────────────────────────────────────────────
  cardSeparator: {
    height: 10,
    backgroundColor: '#f0f4f8',
  },
});
