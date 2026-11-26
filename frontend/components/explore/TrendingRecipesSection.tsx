import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { TrendingRecipeItem } from '@/services/recipe/recipeService';

interface TrendingRecipesSectionProps {
  trendingRecipes: TrendingRecipeItem[];
  toggleSaveTrending: (id: string | number) => void;
}

export const TrendingRecipesSection: React.FC<TrendingRecipesSectionProps> = ({
  trendingRecipes,
  toggleSaveTrending,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Công thức thịnh hành</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingScroll}
      >
        {trendingRecipes.map((recipe) => (
          <TouchableOpacity 
            key={recipe.id} 
            style={styles.trendingCard}
            onPress={() => router.push(`/recipe/${recipe.id}` as any)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: recipe.image }} style={styles.trendingImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.82)']}
              locations={[0, 0.45, 1]}
              style={styles.trendingOverlay}
            />

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
              <Text style={styles.trendingTitle} numberOfLines={2}>{recipe.title}</Text>
              <Text style={styles.trendingSub} numberOfLines={1}>bởi {recipe.author}</Text>
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
    ...StyleSheet.absoluteFill,
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
    lineHeight: 19,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  trendingSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bookmarkBtn: {
    position: 'absolute',
    bottom: 12,
    right: 10,
    padding: 6,
  },
});
