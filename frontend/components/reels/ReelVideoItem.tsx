import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import ReelRightActionBar from './ReelRightActionBar';
import ReelBottomInfo from './ReelBottomInfo';

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
      <ReelRightActionBar
        item={item}
        isActive={isActive}
        isPlaying={isPlaying}
        toggleLike={toggleLike}
        toggleFollow={toggleFollow}
        onOpenComments={onOpenComments}
        onOpenShare={onOpenShare}
      />

      {/* Lớp thông tin phủ ở góc dưới bên trái */}
      <ReelBottomInfo item={item} toggleFollow={toggleFollow} />
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
    zIndex: 5,
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
});
