import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ProfileStatsRowProps {
  followingCount: number;
  followerCount: number;
  totalLikesCount: number;
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  dynamicBorderColor: string;
  onPressFollowing?: () => void;
  onPressFollowers?: () => void;
}

export const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({
  followingCount = 0,
  followerCount = 0,
  totalLikesCount = 0,
  dynamicTextColor,
  dynamicSubTextColor,
  dynamicBorderColor,
  onPressFollowing,
  onPressFollowers,
}) => {
  return (
    <View style={styles.statsRow}>
      {/* 1. Đã follow (Following) */}
      <TouchableOpacity style={styles.statItem} onPress={onPressFollowing} activeOpacity={0.7}>
        <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
          {(followingCount ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: dynamicSubTextColor }]}>Đã follow</Text>
      </TouchableOpacity>

      <View style={[styles.statDivider, { backgroundColor: dynamicBorderColor }]} />

      {/* 2. Follower */}
      <TouchableOpacity style={styles.statItem} onPress={onPressFollowers} activeOpacity={0.7}>
        <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
          {(followerCount ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: dynamicSubTextColor }]}>Follower</Text>
      </TouchableOpacity>

      <View style={[styles.statDivider, { backgroundColor: dynamicBorderColor }]} />

      {/* 3. Thích (Total Likes) */}
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
          {(totalLikesCount ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: dynamicSubTextColor }]}>Thích</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
  },
});
