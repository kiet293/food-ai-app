import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileTabType } from './ProfileTabBar';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 6) / 3;

interface ProfileVideoGridProps {
  activeTab: ProfileTabType;
  reelsList?: any[];
  savedRecipesList?: any[];
  likedReelsList?: any[];
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  dynamicCardBg: string;
  onNavigateToPlay: (reelId: string) => void;
}

export const ProfileVideoGrid: React.FC<ProfileVideoGridProps> = ({
  activeTab,
  reelsList = [],
  savedRecipesList = [],
  likedReelsList = [],
  dynamicTextColor,
  dynamicSubTextColor,
  dynamicCardBg,
  onNavigateToPlay,
}) => {
  if (activeTab === 'posted') {
    return (
      <View style={styles.gridContainer}>
        {reelsList && reelsList.length > 0 ? (
          <View style={styles.gridRow}>
            {reelsList.map((reel, idx) => (
              <TouchableOpacity
                key={reel.id || idx}
                style={styles.gridSquare}
                onPress={() => onNavigateToPlay(reel.id)}
              >
                <Image source={{ uri: reel.posterUrl }} style={styles.gridImage} />
                <View style={styles.playCountOverlay}>
                  <Ionicons name="play-outline" size={14} color="#fff" style={{ marginRight: 3 }} />
                  <Text style={styles.playCountText}>{reel.viewsCount ?? 0}</Text>
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
    );
  }

  if (activeTab === 'saved') {
    return (
      <View style={styles.recipesTabContainer}>
        <Text style={[styles.collectionsHeaderTitle, { color: dynamicTextColor }]}>BỘ SỰ TẬP</Text>
        {savedRecipesList && savedRecipesList.length > 0 ? (
          savedRecipesList.map((item, idx) => (
            <View key={item.id || idx} style={[styles.recipeCard, { backgroundColor: dynamicCardBg }]}>
              <Image
                source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' }}
                style={styles.recipeImg}
              />
              <View style={styles.recipeInfo}>
                <Text style={[styles.recipeTitle, { color: dynamicTextColor }]} numberOfLines={1}>
                  {item.recipeName || item.title || 'Món ăn đã lưu'}
                </Text>
                <Text style={[styles.recipeSub, { color: dynamicSubTextColor }]}>
                  {item.savedAt ? `Đã lưu: ${item.savedAt}` : (item.time || '15 phút · 350 kcal')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#aaa" />
            </View>
          ))
        ) : (
          <View style={styles.emptyCollectionsState}>
            <Text style={[styles.emptyCollectionsSub, { color: dynamicSubTextColor }]}>
              Chưa có bộ sưu tập nào.
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (activeTab === 'liked') {
    return (
      <View style={styles.gridContainer}>
        {likedReelsList && likedReelsList.length > 0 ? (
          <View style={styles.gridRow}>
            {likedReelsList.map((reel, idx) => (
              <TouchableOpacity
                key={reel.id || idx}
                style={styles.gridSquare}
                onPress={() => onNavigateToPlay(reel.id)}
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
    );
  }

  return (
    <View style={styles.emptyTabState}>
      <Ionicons name="lock-closed-outline" size={48} color={dynamicSubTextColor} />
      <Text style={[styles.emptyStateTitle, { color: dynamicTextColor }]}>Video riêng tư</Text>
      <Text style={[styles.emptyStateSub, { color: dynamicSubTextColor }]}>
        Chỉ có bạn mới xem được các video riêng tư của chính mình.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
  collectionsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyCollectionsState: {
    paddingVertical: 24,
  },
  emptyCollectionsSub: {
    fontSize: 14,
    color: '#888',
  },
});
