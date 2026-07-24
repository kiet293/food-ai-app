import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchReels, toggleLikeReel } from '@/services/reelService';
import { CommentModal } from '@/components/community/CommentModal';
import { SharePostModal } from '@/components/community/SharePostModal';
import CreateReelModal from '@/components/reels/CreateReelModal';
import ReelVideoItem, { ReelItem } from '@/components/reels/ReelVideoItem';

const { height } = Dimensions.get('window');

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  // Khởi tạo chiều cao
  const [reelHeight, setReelHeight] = useState(height - insets.bottom - 60);

  const [reels, setReels] = useState<ReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string>('');

  // Quản lý trạng thái mở/đóng các Modal tương tác
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [activeReelForModal, setActiveReelForModal] = useState<ReelItem | null>(null);

  // Hàm gọi API để lấy danh sách video Reels mới nhất từ database PostgreSQL
  const loadReels = async () => {
    setIsLoading(true);
    const data = await fetchReels();
    setReels(data);
    if (data.length > 0) {
      setActiveReelId(data[0].id); // Mặc định chạy video đầu tiên trong danh sách
    }
    setIsLoading(false);
  };

  // Gọi loadReels khi màn hình được khởi tạo (Mount)
  useEffect(() => {
    loadReels();

    // Cấu hình chế độ âm thanh toàn hệ thống cho Expo (Cho phép phát âm thanh khi máy bật chế độ im lặng)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    }).catch(err => console.log('Audio mode error:', err));
  }, []);

  // Hàm xử lý Thả tim/Bỏ thả tim đồng bộ Backend
  const toggleLike = async (reelId: string, dbId?: number) => {
    // 1. Optimistic UI: Cập nhật giao diện ngay lập tức trước khi gọi API xong để mang lại trải nghiệm mượt mà
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            isLiked,
            likesCount: isLiked ? r.likesCount + 1 : r.likesCount - 1,
          };
        }
        return r;
      })
    );

    // 2. Gọi API chạy ngầm ở Backend lưu trữ vào PostgreSQL
    if (dbId) {
      try {
        await toggleLikeReel(dbId);
      } catch (err) {
        console.error("Lỗi khi gửi API like:", err);
      }
    }
  };

  // Hàm xử lý theo dõi/bỏ theo dõi đầu bếp ảo
  const toggleFollow = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          return {
            ...r,
            author: { ...r.author, isFollowing: !r.author.isFollowing },
          };
        }
        return r;
      })
    );
  };

  // Hàm bật/tắt tiếng chung cho toàn bộ các video đang phát
  const toggleMuteAll = () => {
    setIsMuted(!isMuted);
  };

  // Callback to track active visible video
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveReelId(viewableItems[0].key);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70, // Play when 70% of item is viewable
  }).current;

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { height: layoutHeight } = e.nativeEvent.layout;
        if (layoutHeight > 0) {
          setReelHeight(layoutHeight);
        }
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header Overlay */}
      <View style={[styles.headerOverlay, { top: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Food Reels 🎬</Text>
        <TouchableOpacity style={styles.cameraBtn} onPress={() => setIsCreateReelOpen(true)}>
          <Ionicons name="videocam-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Loading state indicator */}
      {isLoading ? (
        <View style={styles.centerPlayIcon}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Đang tải video nấu ăn...</Text>
        </View>
      ) : (
        /* Vertical Paging FlatList */
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={reelHeight}
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <ReelVideoItem
              item={item}
              isActive={item.id === activeReelId}
              isMuted={isMuted}
              reelHeight={reelHeight}
              onToggleMute={toggleMuteAll}
              toggleLike={toggleLike}
              toggleFollow={toggleFollow}
              onOpenComments={(r) => {
                setActiveReelForModal(r);
                setIsCommentModalOpen(true);
              }}
              onOpenShare={(r) => {
                setActiveReelForModal(r);
                setIsShareModalOpen(true);
              }}
            />
          )}
        />
      )}

      {/* Modals */}
      <CommentModal
        visible={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postTitle={activeReelForModal?.recipe?.title}
      />

      <SharePostModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postTitle={activeReelForModal?.caption}
      />

      <CreateReelModal
        visible={isCreateReelOpen}
        onClose={() => setIsCreateReelOpen(false)}
        onReelCreated={loadReels}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cameraBtn: {
    padding: 6,
  },
  centerPlayIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
