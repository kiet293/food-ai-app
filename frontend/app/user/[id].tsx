import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_RECENT_RECIPES = [
  { id: '1', title: 'Lemon Dijon Chicken Orzo...', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=500&q=80' },
  { id: '2', title: 'Parmesan Baked Pork C...', image: 'https://images.unsplash.com/photo-1627308595229-7830b5c91f5f?w=500&q=80' },
  { id: '3', title: 'Lemon Herb Chicken Bak...', image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&q=80' },
];

const MOCK_COLLECTIONS = [
  { id: 'c1', title: 'BREAD', count: 12, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80' },
  { id: 'c2', title: 'CHICKEN', count: 2, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80' },
  { id: 'c3', title: 'FRUIT DESSERT', count: 18, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80' },
  { id: 'c4', title: 'MIDDLE EASTERN MEALS', count: 81, image: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=500&q=80' },
];

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80' }} 
            style={styles.avatar} 
          />
          <View style={styles.infoBlock}>
            <Text style={styles.name}>SHARON SMITH</Text>
            <Text style={styles.handle}>@chefSSmith760</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>made</Text>
                <Text style={styles.statValue}>101</Text>
              </View>
              <View style={[styles.statItem, styles.statBorder]}>
                <Text style={styles.statLabel}>want to make</Text>
                <Text style={styles.statValue}>674</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>followers</Text>
                <Text style={styles.statValue}>114</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Follow Button */}
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followBtnText}>Follow</Text>
        </TouchableOpacity>

        {/* Section: RECENTLY ADDED */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>RECENTLY ADDED</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MOCK_RECENT_RECIPES.map(recipe => (
              <TouchableOpacity key={recipe.id} style={styles.recentCard}>
                <Image source={{ uri: recipe.image }} style={styles.recentImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.recentGradient}
                >
                  <Text style={styles.recentTitle} numberOfLines={2}>{recipe.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section: COLLECTIONS */}
        <View style={[styles.sectionContainer, { paddingBottom: 40 }]}>
          <Text style={styles.sectionTitle}>COLLECTIONS</Text>
          <View style={styles.collectionsList}>
            {MOCK_COLLECTIONS.map(collection => (
              <TouchableOpacity key={collection.id} style={styles.collectionCard}>
                <Image source={{ uri: collection.image }} style={styles.collectionImage} />
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionTitle}>{collection.title}</Text>
                  <Text style={styles.collectionSubtitle}>{collection.count} recipes</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" style={styles.collectionChevron} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    padding: 8,
    marginLeft: 8,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8, // Kéo lệch sang trái một chút để cân bằng
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 16,
  },
  infoBlock: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  handle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'lowercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 16,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
  },
  recentCard: {
    width: 130,
    height: 160,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  recentImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  recentGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 10,
  },
  recentTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  collectionsList: {
    paddingHorizontal: 20,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  collectionImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  collectionInfo: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  collectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  collectionSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  collectionChevron: {
    paddingHorizontal: 16,
  },
});
