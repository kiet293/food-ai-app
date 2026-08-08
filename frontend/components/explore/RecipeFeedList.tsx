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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExploreFeedItem, ExploreFeedResponse } from '@/services/recipe/recipeService';
import { favoriteRecipe, unfavoriteRecipe } from '@/services/community/communityService';
import { SaveToCollectionModal } from '@/components/collections/SaveToCollectionModal';
import { SharePostModal } from '@/components/community/SharePostModal';

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

  const handleToggleFavorite = async (item: ExploreFeedItem) => {
    const previousFavorited = item.is_favorited;
    const previousCount = item.save_count;

    // Optimistic update
    setData(prev => prev.map(r => r.id === item.id
      ? { ...r, is_favorited: !previousFavorited, save_count: previousFavorited ? previousCount - 1 : previousCount + 1 }
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
        ? { ...r, is_favorited: previousFavorited, save_count: previousCount }
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
      <View style={styles.postContainer}>
        <View style={styles.authorHeader}>
          <View style={styles.authorInfoLeft}>
            {item.author?.avatar ? (
              <Image source={{ uri: item.author.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.author?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View style={styles.authorTextContainer}>
              <Text style={styles.authorName}>{item.author?.name || 'Unknown User'}</Text>
              <Text style={styles.authorHandle}>{item.author?.handle || '@user'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.imageContainer}
          activeOpacity={0.9}
          onPress={() => router.push(`/recipe/${item.id}` as any)}
        >
          <Image source={{ uri: item.image }} style={styles.recipeImage} />
          <View style={styles.titleOverlay}>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {item.title.toUpperCase()}
            </Text>
            <Text style={styles.recipeRatingStat}>
              ⭐ {item.ratings_count > 0 ? `${item.ratings_avg.toFixed(1)} (${item.ratings_count} Đánh giá)` : "Chưa có đánh giá"}
            </Text>
          </View>
        </TouchableOpacity>

        {item.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {renderDescriptionWithTags(item.description)}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleFavorite(item)}
          >
            <Ionicons
              name={item.is_favorited ? "heart" : "heart-outline"}
              size={26}
              color={item.is_favorited ? "#f04d4f" : "#555"}
            />
            <Text style={styles.actionText}>{item.save_count || 0}</Text>
          </TouchableOpacity>

          <View style={styles.dividerVertical} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/recipe/${item.id}?tab=comments` as any)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#555" />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>

          <View style={styles.dividerVertical} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSelectedRecipeForCollection(item.id)}
          >
            <Ionicons 
              name={item.is_in_collection ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={item.is_in_collection ? "#1A1D1E" : "#555"} 
            />
            <Text style={[styles.actionText, item.is_in_collection && { color: '#1A1D1E', fontWeight: 'bold' }]}>Lưu</Text>
          </TouchableOpacity>

          <View style={styles.dividerVertical} />

          <TouchableOpacity style={styles.actionButton} onPress={() => {
            setActivePostForModal(item);
            setIsShareModalOpen(true);
          }}>
            <Ionicons name="paper-plane-outline" size={24} color="#555" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.postDivider} />
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
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={
          isLoading && !isFirstLoad ? (
            <ActivityIndicator size="small" color="#28a745" style={{ margin: 20 }} />
          ) : null
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
    backgroundColor: '#fff',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedScroll: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFB74D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  authorTextContainer: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 2,
  },
  authorHandle: {
    fontSize: 13,
    color: '#777',
  },
  followButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  imageContainer: {
    width: width,
    aspectRatio: 1,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  recipeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 30,
  },
  recipeRatingStat: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
  },
  postDivider: {
    height: 6,
    backgroundColor: '#F5F5F5',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  hashtag: {
    color: '#0056b3',
    fontWeight: 'bold',
  }
});
