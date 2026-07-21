import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostItem } from '@/services/mockCommunityData';

interface FollowingFeedSectionProps {
  posts: PostItem[];
  toggleSavePost: (id: string) => void;
  toggleCookedPost: (id: string) => void;
  onOpenComments: (post: PostItem) => void;
  onOpenShare: (post: PostItem) => void;
}

export const FollowingFeedSection: React.FC<FollowingFeedSectionProps> = ({
  posts,
  toggleSavePost,
  toggleCookedPost,
  onOpenComments,
  onOpenShare,
}) => {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.followingFeed}
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <Image source={{ uri: item.author.avatar }} style={styles.postAuthorAvatar} />
            <View style={styles.postAuthorInfo}>
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>{item.author.name}</Text>
                {item.author.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#28a745"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              <Text style={styles.postTime}>{item.timeAgo}</Text>
            </View>

            <TouchableOpacity style={styles.moreOptionsBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          {/* Media Box */}
          <View style={styles.postMediaContainer}>
            <Image source={{ uri: item.images[0] }} style={styles.postImage} />
            <View style={styles.postTitleOverlay}>
              <Text style={styles.postOverlayTitle}>{item.title}</Text>
            </View>
          </View>

          {/* Description */}
          {item.description && (
            <Text style={styles.postDescription}>{item.description}</Text>
          )}

          {/* Action Bar */}
          <View style={styles.actionBar}>
            {/* Save */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => toggleSavePost(item.id)}
            >
              <Ionicons
                name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={item.isSaved ? '#28a745' : '#444'}
              />
              <Text style={[styles.actionCount, item.isSaved && { color: '#28a745' }]}>
                {item.savesCount}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* Cooked */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => toggleCookedPost(item.id)}
            >
              <Ionicons
                name={item.isCooked ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={item.isCooked ? '#28a745' : '#444'}
              />
              <Text style={[styles.actionCount, item.isCooked && { color: '#28a745' }]}>
                {item.cookedCount}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* Comment */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => onOpenComments(item)}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#444" />
              <Text style={styles.actionCount}>{item.commentsCount}</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* Share */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => onOpenShare(item)}
            >
              <Ionicons name="paper-plane-outline" size={20} color="#444" />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  followingFeed: {
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 8,
    borderBottomColor: '#f5f6f8',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postAuthorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  postAuthorInfo: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  moreOptionsBtn: {
    padding: 6,
  },
  postMediaContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postTitleOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  postOverlayTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  postDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e5e5',
  },
});
