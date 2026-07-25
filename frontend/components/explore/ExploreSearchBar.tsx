import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ExploreSearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  recentItems: string[];
  removeRecent: (q: string) => void;
}

export const ExploreSearchBar: React.FC<ExploreSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  recentItems,
  removeRecent,
}) => {
  const router = useRouter();

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm công thức, nguyên liệu..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
        />

        <TouchableOpacity
          style={styles.aiScanBtn}
          onPress={() => router.push('/modal')}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={20} color="#28a745" />
          <Text style={styles.aiScanText}>AI Scan</Text>
        </TouchableOpacity>
      </View>

      {recentItems.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentChipsScroll}
        >
          {recentItems.map((r) => (
            <View key={r} style={styles.recentChip}>
              <TouchableOpacity
                onPress={() => router.push(`/search?q=${encodeURIComponent(r)}`)}
              >
                <Text style={styles.recentChipText} numberOfLines={1}>
                  {r}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeRecent(r)} hitSlop={6}>
                <Ionicons name="close-circle" size={14} color="#888" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f3f5',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
  },
  aiScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  aiScanText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#28a745',
  },
  recentChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  recentChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
});
