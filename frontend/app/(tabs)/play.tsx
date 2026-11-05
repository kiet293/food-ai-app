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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchReels, fetchReelById, toggleLikeReel, incrementReelView } from '@/services/reel/reelService';
import { followUser, unfollowUser } from '@/services/community/communityService';
import { CommentModal } from '@/components/community/CommentModal';
import { SharePostModal } from '@/components/community/SharePostModal';
import CreateReelModal from '@/components/reels/CreateReelModal';
import ReelVideoItem, { ReelItem } from '@/components/reels/ReelVideoItem';

const { height } = Dimensions.get('window');

export default function PlayScreen() {
  const { reelId, openComments } = useLocalSearchParams<{ reelId?: string; openComments?: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  // Khởi tạo chiều cao
  const [reelHeight, setReelHeight] = useState(height - insets.bottom - 60);

  const [reels, setReels] = useState<ReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingPageRef = useRef(false);
  const generationRef = useRef(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string>('');

  // Quản lý trạng thái mở/đóng các Modal tương tác
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [activeReelForModal, setActiveReelForModal] = useState<ReelItem | null>(null);

  // Hàm gọi API để lấy danh sách video Reels mới nhất từ database PostgreSQL
  const loadReels = async () => {
    const generation = ++generationRef.current;
    loadingPageRef.current = true;
    setIsLoading(true);
    const data = await fetchReels();
    if (generation !== generationRef.current) return;
    pageRef.current = 1;
    hasMoreRef.current = data.length === 20;
    loadingPageRef.current = false;
    setReels(data);
    if (data.length > 0) {
      setActiveReelId(data[0].id); // Mặc định chạy video đầu tiên trong danh sách
    }
    setIsLoading(false);
  };

  const loadMoreReels = async () => {
    if (loadingPageRef.current || !hasMoreRef.current) return;
    loadingPageRef.current = true;
    const generation = generationRef.current;
    const page = pageRef.current + 1;
    try {
      const data: ReelItem[] = await fetchReels(page, 20, true);
      if (generation !== generationRef.current) return;
      setReels(previous => {
        const ids = new Set(previous.map(item => item.id));
        return [...previous, ...data.filter(item => !ids.has(item.id))];
      });
      pageRef.current = page;
      hasMoreRef.current = data.length === 20;
    } catch (error) {
      console.error('Không thể tải thêm video:', error);
    } finally {
      if (generation === generationRef.current) loadingPageRef.current = false;
    }
  };

  // Gọi loadReels khi màn hình được khởi tạo (Mount)
  useEffect(() => {
    loadReels();

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    }).catch(err => console.log('Audio mode error:', err));
  }, []);

  // Tự động tăng lượt xem khi lướt sang video khác
  useEffect(() => {
    if (!activeReelId) return;
    const dbId = parseInt(activeReelId.replace('reel-', ''), 10);
    if (!isNaN(dbId)) {
      incrementReelView(dbId).then(data => {
        if (data && typeof data.viewsCount === 'number') {
          // Cập nhật lượt xem thực tế trên UI cục bộ
          setReels(prev =>
            prev.map(r => (r.id === activeReelId ? { ...r, viewsCount: data.viewsCount } : r))
          );
        }
      }).catch(err => console.log('Error incrementing reel view:', err));
    }
  }, [activeReelId]);

  // Tự động cuộn tới video được chỉ định từ Profile
  useEffect(() => {
    if (!reelId || isLoading || reels.some(item => item.id === reelId || item.db_id?.toString() === reelId)) return;
    const id = Number(reelId.replace('reel-', ''));
    if (!Number.isInteger(id)) return;
    let active = true;
    fetchReelById(id).then(item => {
      if (active && item) setReels(previous => previous.some(existing => existing.id === item.id) ? previous : [item, ...previous]);
    }).catch(error => console.error('Không thể tải video:', error));
    return () => { active = false; };
  }, [reelId, isLoading, reels]);

  useEffect(() => {
    if (reelId && reels.length > 0) {
      const idx = reels.findIndex(r => r.id === reelId || r.db_id?.toString() === reelId);
      if (idx !== -1) {
        setActiveReelId(reels[idx].id);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        }, 100);

        if (openComments === 'true') {
          setActiveReelForModal(reels[idx]);
          setIsCommentModalOpen(true);
        }

        // Clear params to allow scrolling to the same video again next time
        router.setParams({ reelId: undefined, openComments: undefined });
      }
    }
  }, [reelId, reels, openComments, router]);

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

  // Hàm xử lý theo dõi/bỏ theo dõi đầu bếp ảo bằng API thực tế (Optimistic UI)
  const toggleFollow = async (reelId: string) => {
    const targetReel = reels.find((r) => r.id === reelId);
    if (!targetReel) return;

    const targetUserId = parseInt(String(targetReel.author.id).replace(/^user-/, ''), 10);
    if (isNaN(targetUserId)) return;

    // 1. Optimistic Update (Cập nhật giao diện lập tức)
    const previousReelsState = reels;
    const isCurrentlyFollowing = targetReel.author.isFollowing;

    // Cập nhật tất cả các video của cùng tác giả này trên màn hình hiện tại
    setReels((prev) =>
      prev.map((r) => {
        if (r.author.id === targetReel.author.id) {
          return {
            ...r,
            author: { ...r.author, isFollowing: !isCurrentlyFollowing },
          };
        }
        return r;
      })
    );

    try {
      // 2. Gọi API tương ứng từ backend chạy ngầm
      if (isCurrentlyFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    } catch (err: any) {
      // 3. Rollback nếu có lỗi hoặc chưa đăng nhập
      setReels(previousReelsState);
      Alert.alert('Thao tác thất bại', err.message || 'Bạn cần đăng nhập để theo dõi đầu bếp.');
    }
  };

  // Hàm bật/tắt tiếng chung cho toàn bộ các video đang phát
  const toggleMuteAll = () => {
    setIsMuted(!isMuted);
  };

  // Tự động phát video đang hiển thị
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveReelId(viewableItems[0].key);
    }
  }).current;

  // Cấu hình phát video
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const getItemLayout = (data: any, index: number) => ({
    length: reelHeight,
    offset: reelHeight * index,
    index,
  });

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
      <StatusBar barStyle="light-content" />

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
          ref={flatListRef}
          data={reels}
          onEndReached={loadMoreReels}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
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
              isActive={isFocused && item.id === activeReelId}
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
        postTitle={activeReelForModal?.caption}
        reelDbId={activeReelForModal?.db_id}
        onCommentAdded={(newCount) => {
          if (activeReelForModal) {
            // Cập nhật số lượng bình luận hiển thị động trên UI Reels chính
            setReels((prev) =>
              prev.map((r) => {
                if (r.id === activeReelForModal.id) {
                  return { ...r, commentsCount: newCount };
                }
                return r;
              })
            );
          }
        }}
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
