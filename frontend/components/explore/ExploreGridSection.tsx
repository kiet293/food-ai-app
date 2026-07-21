import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 44) / 3;

interface ExploreGridSectionProps {
  gridImages: string[];
}

export const ExploreGridSection: React.FC<ExploreGridSectionProps> = ({ gridImages }) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EXPLORE.</Text>
      </View>
      <View style={styles.gridContainer}>
        {gridImages.map((imgUri, index) => (
          <TouchableOpacity key={index} style={styles.gridItem}>
            <Image source={{ uri: imgUri }} style={styles.gridImage} />
          </TouchableOpacity>
        ))}
      </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 6,
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
