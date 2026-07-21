import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CollectionItem } from '@/services/mockCommunityData';

interface TopCollectionsSectionProps {
  collections: CollectionItem[];
}

export const TopCollectionsSection: React.FC<TopCollectionsSectionProps> = ({
  collections,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TOP COLLECTIONS.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.collectionsScroll}
      >
        {collections.map((collection) => (
          <TouchableOpacity key={collection.id} style={styles.collectionCard}>
            <Image source={{ uri: collection.image }} style={styles.collectionImage} />
            <View style={styles.collectionOverlay} />
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
            <View style={styles.collectionContent}>
              <Text style={styles.collectionTitle}>{collection.title}</Text>
              <Text style={styles.collectionSub}>{collection.recipeCount} recipes</Text>
            </View>
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
  collectionsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  collectionCard: {
    width: 220,
    height: 125,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  plusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionContent: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  collectionSub: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 2,
  },
});
