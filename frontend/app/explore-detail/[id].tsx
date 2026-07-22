import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { fetchExploreFeed, ExploreFeedItem } from '@/services/exploreService';

const { width } = Dimensions.get('window');

export default function ExploreDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<ExploreFeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadData = async (isLoadMore = false) => {
    if (isLoading || (!hasMore && isLoadMore)) return;

    setIsLoading(true);

    // Nếu là load lần đầu, dùng id từ URL làm startId. Nếu load thêm, dùng cursor
    const startId = isLoadMore ? cursor : parseInt(id as string, 10);

    // Nếu startId không hợp lệ và không phải load thêm
    if (!startId && !isLoadMore) {
      setIsLoading(false);
      return;
    }

    const response = await fetchExploreFeed(startId, 5);

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
    if (id) {
      loadData(false);
    }
  }, [id]);

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
          </View>
        </TouchableOpacity>

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="bookmark" size={24} color="#555" />
            <Text style={styles.actionText}>{item.save_count || 0}</Text>
          </TouchableOpacity>

          <View style={styles.dividerVertical} />

          <TouchableOpacity style={styles.actionButton}>
            <Feather name="check-circle" size={24} color="#555" />
            <Text style={styles.actionText}>{item.cooked_count || 0}</Text>
          </TouchableOpacity>

          <View style={styles.dividerVertical} />

          <TouchableOpacity style={styles.actionButton}>
            <Feather name="message-circle" size={24} color="#555" />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>

          <View style={styles.dividerVertical} />

          <TouchableOpacity style={styles.actionButton}>
            <Feather name="send" size={24} color="#555" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.postDivider} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXPLORE.</Text>
        <View style={{ width: 40 }} />
      </View>

      {isFirstLoad ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#ff5a5f" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          onEndReached={() => loadData(true)}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading && !isFirstLoad ? (
              <ActivityIndicator size="small" color="#ff5a5f" style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#000',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    aspectRatio: 1, // Hình vuông hoặc 4/5 tùy ý, set 1 để đảm bảo full width bự
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
  }
});
