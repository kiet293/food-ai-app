import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';

export type IngredientCard = {
  name: string;
  image: ImageSourcePropType;
  composition: string[];
  benefits: string[];
  dishes: string[];
};

interface PopularIngredientsSectionProps {
  ingredientCards: IngredientCard[];
  onSelectIngredient: (item: IngredientCard) => void;
}

export const PopularIngredientsSection: React.FC<PopularIngredientsSectionProps> = ({
  ingredientCards,
  onSelectIngredient,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>NGUYÊN LIỆU PHỔ BIẾN.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ingredientsScroll}
      >
        {ingredientCards.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.ingredientCard}
            onPress={() => onSelectIngredient(item)}
          >
            <Image source={item.image} style={styles.ingredientImage} />
            <View style={styles.ingredientOverlay} />
            <View style={styles.dishCountBadge}>
              <Text style={styles.dishCountText}>{item.dishes.length} món</Text>
            </View>
            <Text style={styles.ingredientName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
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
  ingredientsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  ingredientCard: {
    width: 140,
    height: 100,
    borderRadius: 14,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  ingredientImage: {
    width: '100%',
    height: '100%',
  },
  ingredientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dishCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(40,167,69,0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dishCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  ingredientName: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
