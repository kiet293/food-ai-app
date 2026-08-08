import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface HotTagsSectionProps {
  tags: string[];
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
}

export const HotTagsSection: React.FC<HotTagsSectionProps> = ({
  tags,
  selectedTag,
  setSelectedTag,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>HOT TAGS.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hotTagsScroll}
      >
        {tags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tagPill, isSelected && styles.tagPillActive]}
              onPress={() => {
                if (isSelected) {
                  setSelectedTag('Tất Cả');
                } else {
                  setSelectedTag(tag);
                }
              }}
            >
              <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                #{tag}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  hotTagsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    marginRight: 10,
  },
  tagPillActive: {
    backgroundColor: '#28a745',
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28a745',
  },
  tagPillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
