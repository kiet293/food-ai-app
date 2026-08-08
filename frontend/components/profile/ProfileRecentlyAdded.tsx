import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const MOCK_RECENT_RECIPES = [
  {
    id: 'rec-1',
    title: 'Trứng cuộn cà chua hành lá',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
  },
  {
    id: 'rec-2',
    title: 'Canh chua tôm Nam Bộ',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
  },
  {
    id: 'rec-3',
    title: 'Tôm rim mặn mòi',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500',
  },
  {
    id: 'rec-4',
    title: 'Sườn xào chua ngọt',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500',
  },
];

interface ProfileRecentlyAddedProps {
  recipes?: any[];
  isDarkMode: boolean;
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  onPressRecipe?: (recipeId: string) => void;
}

export const ProfileRecentlyAdded: React.FC<ProfileRecentlyAddedProps> = ({
  recipes = [],
  isDarkMode,
  dynamicTextColor,
  dynamicSubTextColor,
  onPressRecipe,
}) => {
  const displayList = recipes && recipes.length > 0
    ? recipes.map((r) => ({
        id: r.id || r.recipe_id,
        title: r.recipeName || r.title || 'Món ăn ngon',
        image: r.imageUrl || r.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      }))
    : MOCK_RECENT_RECIPES;

  return (
    <View style={styles.sectionContainer}>
      {/* Title Header: Bài viết */}
      <Text style={[styles.sectionTitle, { color: dynamicTextColor }]}>Bài viết</Text>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {displayList.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={styles.cardItem}
            activeOpacity={0.85}
            onPress={() => onPressRecipe && onPressRecipe(item.id)}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />

            {/* Gradient Overlay at Bottom */}
            <View style={styles.bottomOverlay}>
              <Text style={styles.cardTitleText} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cardItem: {
    width: 130,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 6,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  cardTitleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
