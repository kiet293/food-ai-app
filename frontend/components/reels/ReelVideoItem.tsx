import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';

const { width } = Dimensions.get('window');

// Định nghĩa kiểu dữ liệu ReelItem dùng chung
export interface ReelItem {
  id: string;
  db_id?: number;
  isPexels?: boolean;
  author: {
    id: string;
    name: string;
    avatar: string;
    isFollowing?: boolean;
  };
  caption: string;
  videoUrl: string;
  posterUrl: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  savesCount: number;
  isSaved?: boolean;
  sharesCount: number;
  musicTrack: string;
  audioUrl?: string;
  recipe?: {
    id: number;
    title: string;
    ingredients: string[];
    instructions: string[];
  } | null;
}

interface ReelVideoItemProps {
  item: ReelItem;                // Dữ liệu của video hiện tại
  isActive: boolean;            // Video này có đang được hiển thị chính giữa màn hình không (để tự phát)
  isMuted: boolean;             // Trạng thái tắt tiếng chung của app
  reelHeight: number;           // Chiều cao khả dụng của 1 thẻ video
  onToggleMute: () => void;     // Hàm đổi trạng thái tắt/bật tiếng
  toggleLike: (id: string, dbId?: number) => void;  // Hàm thả tim
  toggleFollow: (id: string) => void;                // Hàm theo dõi tác giả
  onOpenComments: (item: ReelItem) => void;          // Mở modal bình luận
  onOpenShare: (item: ReelItem) => void;             // Mở modal chia sẻ
  onPlayStateChange?: (isPlaying: boolean) => void;   // Báo trạng thái phát/dừng về component cha
}

export default function ReelVideoItem({
  item,
  isActive,
  isMuted,
  reelHeight,
  onToggleMute,
  toggleLike,
  toggleFollow,
  onOpenComments,
  onOpenShare,
  onPlayStateChange,
}: ReelVideoItemProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isPlaying, setIsPlaying] = useState(true);

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

  // Hook useEffect tự động điều khiển phát/dừng video dựa trên trạng thái isActive (đang xem)
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.playAsync(); // Tự động phát khi trượt đến video này
        setIsPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true);
      } else {
        videoRef.current.stopAsync(); // Tự động dừng khi trượt qua video khác
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  // Tạm dừng hoặc Phát tiếp
  const handlePlayPause = () => {
    if (videoRef.current) {
      const nextState = !isPlaying;
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(nextState);
      if (onPlayStateChange) {
        onPlayStateChange(nextState);
      }
    }
  };

  return (
    <View style={[styles.reelCard, { height: reelHeight }]}>
      {/* Trình phát Video nền hoặc hiển thị ảnh bìa nếu link lỗi */}
      {item.videoUrl ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={handlePlayPause}>
          <Video
            ref={videoRef}
            style={styles.backgroundMedia}
            source={{ uri: item.videoUrl }}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted={isMuted}
            shouldPlay={isActive && isPlaying}
            onPlaybackStatusUpdate={(s) => setStatus(() => s)}
            onError={(error) => console.log('Video Playback Error:', error)}
          />
        </Pressable>
      ) : (
        <Image source={{ uri: item.posterUrl }} style={styles.backgroundMedia} />
      )}
      <View style={styles.gradientOverlay} pointerEvents="none" />

      {status.isBuffering && (
        <View style={styles.centerPlayIcon}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Biểu tượng nút Play hiển thị nếu video đang bị tạm dừng */}
      {!isPlaying && (
        <Pressable style={styles.centerPlayIcon} onPress={handlePlayPause}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={32} color="rgba(255,255,255,0.85)" />
          </View>
        </Pressable>
      )}

      {/* Nút bấm bật/tắt tiếng */}
      <TouchableOpacity style={styles.muteBtn} onPress={onToggleMute}>
        <Ionicons
          name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Thanh công cụ tương tác bên phải */}
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

      {/* Lớp thông tin phủ ở góc dưới bên trái */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  reelCard: {
    width: width,
    position: 'relative',
    backgroundColor: '#111',
  },
  backgroundMedia: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  centerPlayIcon: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  muteBtn: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  rightActionBar: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    alignItems: 'center',
    gap: 16,
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
  bottomInfoOverlay: {
    position: 'absolute',
    left: 16,
    right: 70,
    bottom: 12,
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
