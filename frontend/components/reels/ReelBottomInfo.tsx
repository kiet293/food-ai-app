import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReelItem } from './ReelVideoItem';

interface ReelBottomInfoProps {
  item: ReelItem;
  toggleFollow: (id: string) => void;
}

export default function ReelBottomInfo({ item, toggleFollow }: ReelBottomInfoProps) {
  return (
    <View style={styles.bottomInfoOverlay}>
      {/* Tên đầu bếp + Nút theo dõi chính */}
      <View style={styles.authorRow}>
        <Text style={styles.authorName}>{item.author.name}</Text>
        <Text style={styles.authorDot}>•</Text>
        <TouchableOpacity
          style={[
            styles.followPill,
            item.author.isFollowing && styles.followPillActive,
          ]}
          onPress={() => toggleFollow(item.id)}
        >
          <Text style={styles.followPillText}>
            {item.author.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung caption mô tả clip ngắn */}
      <Text style={styles.captionText} numberOfLines={2}>
        {item.caption}
      </Text>

      {/* Tên bản nhạc nền đang phát */}
      <View style={styles.musicRow}>
        <Ionicons name="musical-notes-outline" size={12} color="#fff" />
        <Text style={styles.musicText} numberOfLines={1}>
          {item.musicTrack}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomInfoOverlay: {
    position: 'absolute',
    left: 16,
    right: 70,
    bottom: 12,
    zIndex: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  authorDot: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginHorizontal: 6,
  },
  followPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followPillActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'transparent',
  },
  followPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  captionText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicText: {
    color: '#fff',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
