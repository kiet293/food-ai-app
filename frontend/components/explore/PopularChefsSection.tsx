import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChefItem } from '@/services/mockCommunityData';

interface PopularChefsSectionProps {
  chefs: ChefItem[];
  toggleFollowChef: (id: string) => void;
}

export const PopularChefsSection: React.FC<PopularChefsSectionProps> = ({
  chefs,
  toggleFollowChef,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>POPULAR CHEFS.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chefsScroll}
      >
        {chefs.map((chef) => (
          <TouchableOpacity
            key={chef.id}
            style={styles.chefItem}
            onPress={() => toggleFollowChef(chef.id)}
          >
            <View
              style={[
                styles.avatarBorder,
                chef.isFollowing && styles.avatarBorderActive,
              ]}
            >
              <Image source={{ uri: chef.avatar }} style={styles.chefAvatar} />
              {chef.isFollowing && (
                <View style={styles.followingBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.chefName} numberOfLines={1}>
              {chef.name}
            </Text>
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
  chefsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  chefItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  avatarBorderActive: {
    borderColor: '#28a745',
  },
  chefAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  followingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#28a745',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  chefName: {
    fontSize: 12,
    color: '#444',
    marginTop: 6,
    fontWeight: '600',
  },
});
