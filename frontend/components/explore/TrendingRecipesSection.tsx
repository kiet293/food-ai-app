import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrendingRecipeItem } from '@/services/mockCommunityData';

interface TrendingRecipesSectionProps {
  trendingRecipes: TrendingRecipeItem[];
  toggleSaveTrending: (id: string) => void;
}

export const TrendingRecipesSection: React.FC<TrendingRecipesSectionProps> = ({
  trendingRecipes,
  toggleSaveTrending,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TRENDING RECIPES.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingScroll}
      >
        {trendingRecipes.map((recipe) => (
          <TouchableOpacity key={recipe.id} style={styles.trendingCard}>
            <Image source={{ uri: recipe.image }} style={styles.trendingImage} />
            <View style={styles.trendingOverlay} />

            {recipe.badge && (
              <View style={styles.recipeBadge}>
                <Text style={styles.recipeBadgeText}>{recipe.badge}</Text>
              </View>
            )}

            <View style={styles.trendingContent}>
              <Text style={styles.trendingTitle}>{recipe.title}</Text>
              <Text style={styles.trendingSub}>By {recipe.author}</Text>
            </View>

            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={() => toggleSaveTrending(recipe.id)}
            >
              <Ionicons
                name={recipe.saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={recipe.saved ? '#28a745' : '#fff'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  trendingScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  trendingCard: {
    width: 190,
    height: 220,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  recipeBadge: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recipeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#28a745',
  },
  trendingContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 40,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 18,
  },
  trendingSub: {
    fontSize: 11,
    color: '#ddd',
    marginTop: 2,
  },
  bookmarkBtn: {
    position: 'absolute',
    bottom: 12,
    right: 10,
    padding: 6,
  },
});
