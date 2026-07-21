import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_REELS, ReelItem } from '@/services/mockReelsData';
import { CommentModal } from '@/components/CommentModal';
import { SharePostModal } from '@/components/SharePostModal';

const { width, height } = Dimensions.get('window');
const REEL_HEIGHT = height - 120; // Full screen item height minus bottom nav bar

export default function PlayScreen() {
  const [reels, setReels] = useState<ReelItem[]>(MOCK_REELS);
  const [selectedRecipeReel, setSelectedRecipeReel] = useState<ReelItem | null>(null);

  // Modals state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeReelForModal, setActiveReelForModal] = useState<ReelItem | null>(null);

  const toggleLike = (reelId: string) => {
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
  };

  const toggleSave = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const isSaved = !r.isSaved;
          return {
            ...r,
            isSaved,
            savesCount: isSaved ? r.savesCount + 1 : r.savesCount - 1,
          };
        }
        return r;
      })
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>Food Reels 🎬</Text>
        <TouchableOpacity style={styles.cameraBtn}>
          <Ionicons name="videocam-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vertical Paging FlatList */}
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={REEL_HEIGHT}
        snapToAlignment="start"
        renderItem={({ item }) => (
          <View style={[styles.reelCard, { height: REEL_HEIGHT }]}>
            {/* Background Media Poster/Video */}
            <Image source={{ uri: item.posterUrl }} style={styles.backgroundMedia} />
            <View style={styles.gradientOverlay} />

            {/* Play Button Overlay Indicator */}
            <View style={styles.centerPlayIcon}>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={32} color="rgba(255,255,255,0.85)" />
              </View>
            </View>

            {/* Right Action Bar */}
            <View style={styles.rightActionBar}>
              {/* Author Avatar with Follow Badge */}
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

              {/* Like Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => toggleLike(item.id)}
              >
                <Ionicons
                  name={item.isLiked ? 'heart' : 'heart-outline'}
                  size={30}
                  color={item.isLiked ? '#ff4757' : '#fff'}
                />
                <Text style={styles.actionText}>{item.likesCount}</Text>
              </TouchableOpacity>

              {/* Comment Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setActiveReelForModal(item);
                  setIsCommentModalOpen(true);
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
                <Text style={styles.actionText}>{item.commentsCount}</Text>
              </TouchableOpacity>

              {/* Bookmark Save Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => toggleSave(item.id)}
              >
                <Ionicons
                  name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={28}
                  color={item.isSaved ? '#28a745' : '#fff'}
                />
                <Text style={styles.actionText}>{item.savesCount}</Text>
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setActiveReelForModal(item);
                  setIsShareModalOpen(true);
                }}
              >
                <Ionicons name="paper-plane-outline" size={26} color="#fff" />
                <Text style={styles.actionText}>{item.sharesCount}</Text>
              </TouchableOpacity>

              {/* Rotating Audio Disc */}
              <View style={styles.audioDisc}>
                <Image source={{ uri: item.author.avatar }} style={styles.discImg} />
              </View>
            </View>

            {/* Bottom Left Information Overlay */}
            <View style={styles.bottomInfoOverlay}>
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>{item.author.name}</Text>
                <TouchableOpacity
                  style={[
                    styles.followPill,
                    item.author.isFollowing && styles.followPillActive,
                  ]}
                  onPress={() => toggleFollow(item.id)}
                >
                  <Text style={styles.followPillText}>
                    {item.author.isFollowing ? 'Đang Theo Dõi' : 'Theo Dõi'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Caption */}
              <Text style={styles.captionText} numberOfLines={2}>
                {item.caption}
              </Text>

              {/* Recipe Quick Link Trigger */}
              <TouchableOpacity
                style={styles.recipeLinkBtn}
                onPress={() => setSelectedRecipeReel(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="restaurant" size={16} color="#fff" />
                <Text style={styles.recipeLinkText}>
                  Xem Công Thức Chi Tiết ({item.recipe.title})
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>

              {/* Music Marquee */}
              <View style={styles.musicRow}>
                <Ionicons name="musical-notes-outline" size={14} color="#ddd" />
                <Text style={styles.musicText} numberOfLines={1}>
                  {item.musicTrack}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Comments & Share Modals */}
      <CommentModal
        visible={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postTitle={activeReelForModal?.recipe.title}
      />

      <SharePostModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postTitle={activeReelForModal?.caption}
      />

      {/* Recipe Details Modal from Reel */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedRecipeReel !== null}
        onRequestClose={() => setSelectedRecipeReel(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRecipeReel(null)} />
          <View style={styles.modalCard}>
            {selectedRecipeReel && (
              <>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRecipeTitle}>
                      {selectedRecipeReel.recipe.title}
                    </Text>
                    <Text style={styles.modalRecipeAuthor}>
                      🍳 Bởi {selectedRecipeReel.author.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRecipeReel(null)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Image
                    source={{ uri: selectedRecipeReel.posterUrl }}
                    style={styles.modalHeroImg}
                  />

                  <Text style={styles.sectionTitle}>🛒 Nguyên liệu chuẩn bị:</Text>
                  {selectedRecipeReel.recipe.ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <View style={styles.greenDot} />
                      <Text style={styles.ingText}>{ing}</Text>
                    </View>
                  ))}

                  <Text style={styles.sectionTitle}>🍳 Hướng dẫn chế biến:</Text>
                  {selectedRecipeReel.recipe.instructions.map((step, idx) => (
                    <View key={idx} style={styles.stepRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepNum}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}

                  <View style={{ height: 20 }} />
                </ScrollView>

                <TouchableOpacity
                  style={styles.saveBtnModal}
                  onPress={() => {
                    toggleSave(selectedRecipeReel.id);
                    setSelectedRecipeReel(null);
                  }}
                >
                  <Text style={styles.saveBtnTextModal}>
                    ❤️ Lưu Công Thức Vào Sổ Tay
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerOverlay: {
    position: 'absolute',
    top: 40,
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
  reelCard: {
    width: width,
    position: 'relative',
    backgroundColor: '#111',
  },
  backgroundMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  rightActionBar: {
    position: 'absolute',
    right: 12,
    bottom: 40,
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
    bottom: 30,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 6,
  },
  followPill: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  followPillActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  followPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  recipeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  recipeLinkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicText: {
    color: '#ddd',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalRecipeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  modalRecipeAuthor: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  modalHeroImg: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginTop: 10,
    marginBottom: 6,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  ingText: {
    fontSize: 14,
    color: '#444',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNum: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    lineHeight: 20,
  },
  saveBtnModal: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnTextModal: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
