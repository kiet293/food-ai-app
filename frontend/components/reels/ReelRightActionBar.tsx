import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReelItem } from './ReelVideoItem';

interface ReelRightActionBarProps {
  item: ReelItem;
  isActive: boolean;
  isPlaying: boolean;
  toggleLike: (id: string, dbId?: number) => void;
  toggleFollow: (id: string) => void;
  onOpenComments: (item: ReelItem) => void;
  onOpenShare: (item: ReelItem) => void;
}

export default function ReelRightActionBar({
  item,
  isActive,
  isPlaying,
  toggleLike,
  toggleFollow,
  onOpenComments,
  onOpenShare,
}: ReelRightActionBarProps) {
  // Animation xoay đĩa nhạc kiểu TikTok
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isActive && isPlaying) {
      spinValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinValue.stopAnimation();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isActive, isPlaying]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.rightActionBar}>
      {/* Ảnh đại diện tác giả */}
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={() => toggleFollow(item.id)}
      >
        <Image source={{ uri: item.author.avatar }} style={styles.authorAvatar} />
        <View
          style={[
            styles.followBadge,
            item.author.isFollowing && styles.followBadgeActive,
          ]}
        >
          <Ionicons
            name={item.author.isFollowing ? 'checkmark' : 'add'}
            size={12}
            color="#fff"
          />
        </View>
      </TouchableOpacity>

      {/* Nút Thả tim (Like) */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => toggleLike(item.id, item.db_id)}
      >
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={30}
          color={item.isLiked ? '#ff4757' : '#fff'}
        />
        <Text style={styles.actionText}>{item.likesCount}</Text>
      </TouchableOpacity>

      {/* Nút mở Modal bình luận */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onOpenComments(item)}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
        <Text style={styles.actionText}>{item.commentsCount}</Text>
      </TouchableOpacity>

      {/* Nút Lưu (Bookmark) */}
      <TouchableOpacity
        style={styles.actionBtn}
      >
        <Ionicons
          name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
          size={28}
          color={item.isSaved ? '#28a745' : '#fff'}
        />
        <Text style={styles.actionText}>{item.savesCount}</Text>
      </TouchableOpacity>

      {/* Nút mở Modal chia sẻ */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onOpenShare(item)}
      >
        <Ionicons name="paper-plane-outline" size={26} color="#fff" />
        <Text style={styles.actionText}>{item.sharesCount}</Text>
      </TouchableOpacity>

      {/* Đĩa nhạc xoay */}
      <Animated.View style={[styles.audioDisc, { transform: [{ rotate: spin }] }]}>
        <Image source={{ uri: item.author.avatar }} style={styles.discImg} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rightActionBar: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#28a745',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBadgeActive: {
    backgroundColor: '#888',
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  audioDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    borderWidth: 8,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  discImg: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
