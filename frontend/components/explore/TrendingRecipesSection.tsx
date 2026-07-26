import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingRecipeItem } from '@/services/exploreService';

interface TrendingRecipesSectionProps {
  trendingRecipes: TrendingRecipeItem[];
  toggleSaveTrending: (id: string | number) => void;
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
              <LinearGradient
                colors={['#FF7A45', '#FF3D3D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recipeBadge}
              >
                <Ionicons name="flame" size={12} color="#fff" style={styles.recipeBadgeIcon} />
                <Text style={styles.recipeBadgeText}>{recipe.badge.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim()}</Text>
              </LinearGradient>
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
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#FF3D3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  recipeBadgeIcon: {
    marginRight: 4,
  },
  recipeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
