import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchExploreGrid, ExploreGridItem } from '@/services/recipe/recipeService';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 44) / 3;

export const ExploreGridSection: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
  const router = useRouter();
  const [data, setData] = useState<ExploreGridItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    
    const response = await fetchExploreGrid(cursor, 18);
    
    setData(prev => [...prev, ...response.items]);
    if (response.next_cursor) {
      setCursor(response.next_cursor);
    } else {
      setHasMore(false);
    }
    
    setIsLoading(false);
  };

  const refresh = async () => {
    setIsLoading(true);
    const response = await fetchExploreGrid(null, 18);
    setData(response.items);
    if (response.next_cursor) {
      setCursor(response.next_cursor);
      setHasMore(true);
    } else {
      setCursor(null);
      setHasMore(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    loadMore();
  }, []);

  const renderItem = ({ item, index }: { item: ExploreGridItem, index: number }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => router.push({ pathname: "/explore-detail/[id]", params: { id: item.id } })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={styles.gridImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EXPLORE.</Text>
      </View>
      <FlatList
        data={data}
        numColumns={3}
        keyExtractor={(item, index) => `explore-${item.id}-${index}`}
        renderItem={renderItem}
        onEndReached={() => {
          if (data.length > 0) loadMore();
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false} // Tạm thời disable scroll của FlatList để cuộn cùng ScrollView cha (index.tsx)
        ListFooterComponent={
          isLoading ? <ActivityIndicator size="small" color="#2ecc71" style={{ margin: 20 }} /> : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 0.5,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    gap: 6,
    marginBottom: 6,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
