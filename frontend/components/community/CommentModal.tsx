import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchReelComments, createReelComment, toggleCommentLike, Comment } from '@/services/reel/reelService';

// Định nghĩa Props của CommentModal
interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postTitle?: string;
  reelDbId?: number; // Truyền ID của Reel nếu muốn lấy bình luận từ Database thật
  onCommentAdded?: (newCount: number) => void; // Callback báo về màn hình chính khi bình luận thành công
}

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  postTitle,
  reelDbId,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Tải danh sách bình luận thực tế từ API Backend
  const loadComments = async () => {
    if (!reelDbId) return;
    setIsLoading(true);
    try {
      const data = await fetchReelComments(reelDbId);
      setComments(data);
    } catch (err) {
      console.error('Lỗi khi tải bình luận:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải lại bình luận mỗi khi Modal được mở ra
  useEffect(() => {
    if (visible) {
      if (reelDbId) {
        loadComments();
      } else {
        // Mock data nếu không có reelDbId (như bên Explore)
        setComments([
          {
            id: 'c1',
            authorName: 'Snappy Foodie',
            authorAvatar: '👨‍🍳',
            text: 'Món này trông hấp dẫn quá! Cho mình xin lượng phô mai chuẩn nhé.',
            timeAgo: '2 giờ trước',
            likesCount: 5,
            isLiked: false,
          },
          {
            id: 'c2',
            authorName: 'Amber Eats',
            authorAvatar: '👩‍🍳',
            text: 'Đã thử làm theo và thành công rực rỡ! Cảm ơn chef nhé ❤️',
            timeAgo: '4 giờ trước',
            likesCount: 8,
            isLiked: true,
          },
        ]);
      }
    }
  }, [visible, reelDbId]);

  // Xử lý Thả tim cho bình luận
  const toggleLikeComment = async (commentId: string) => {
    let previousState: Comment[] = [];
    setComments((prev) => {
      previousState = prev; // Lưu lại để rollback nếu gặp lỗi
      return prev.map((c) => {
        if (c.id === commentId) {
          const nextIsLiked = !c.isLiked;
          return {
            ...c,
            isLiked: nextIsLiked,
            likesCount: nextIsLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      });
    });

    if (!reelDbId) return;

    try {
      const commentIdInt = parseInt(commentId, 10);
      await toggleCommentLike(commentIdInt);
    } catch (error: any) {
      // Rollback về trạng thái cũ nếu API báo lỗi
      setComments(previousState);
      Alert.alert('Tương tác thất bại', error.message || 'Vui lòng đăng nhập để thích bình luận.');
    }
  };

  // Xử lý gửi bình luận
  const handleSend = async () => {
    if (!newComment.trim()) return;

    if (reelDbId) {
      // 1. Gửi bình luận thật lên Backend
      setIsLoading(true);
      try {
        const newCommentObj = await createReelComment(reelDbId, newComment.trim());
        const updatedList = [newCommentObj, ...comments];
        setComments(updatedList);
        setNewComment('');

        // Gọi callback báo về màn hình Reels để tăng số lượng hiển thị
        if (onCommentAdded) {
          onCommentAdded(updatedList.length);
        }
      } catch (error: any) {
        Alert.alert('Bình luận thất bại', error.message || 'Bạn cần đăng nhập để bình luận.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 2. Fallback gửi bình luận giả nếu không có reelDbId
      const item: Comment = {
        id: Date.now().toString(),
        authorName: 'Bạn (Tôi)',
        authorAvatar: '🥗',
        text: newComment.trim(),
        timeAgo: 'Vừa xong',
        likesCount: 0,
        isLiked: false,
      };
      setComments([item, ...comments]);
      setNewComment('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Bình Luận - {postTitle || 'Bài Viết'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {isLoading && comments.length === 0 ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#28a745" />
              <Text style={{ marginTop: 10, color: '#666' }}>Đang tải bình luận...</Text>
            </View>
          ) : (
            /* List comments */
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  {/* Avatar */}
                  <View style={styles.avatarBox}>
                    {item.authorAvatar.startsWith('http') ? (
                      <Image source={{ uri: item.authorAvatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{item.authorAvatar}</Text>
                    )}
                  </View>

                  {/* Nội dung bên phải */}
                  <View style={styles.commentRightContent}>
                    {/* Bong bóng bình luận */}
                    <View style={styles.commentBody}>
                      <Text style={styles.authorName}>{item.authorName}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>

                    {/* Dòng tương tác bên dưới bong bóng (Kiểu Facebook) */}
                    <View style={styles.commentFooterRow}>
                      <Text style={styles.footerText}>{item.timeAgo}</Text>

                      {item.likesCount > 0 && (
                        <Text style={styles.footerText}>•  {item.likesCount} thích</Text>
                      )}

                      <TouchableOpacity onPress={() => toggleLikeComment(item.id)}>
                        <Text style={[styles.footerActionText, item.isLiked && styles.footerActionTextLiked]}>
                          •  {item.isLiked ? 'Đã thích' : 'Thích'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity>
                        <Text style={styles.footerActionText}>•  Trả lời</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy trở thành người đầu tiên!</Text>
                </View>
              }
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChangeText={setNewComment}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newComment.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!newComment.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 18,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  commentRightContent: {
    flex: 1,
  },
  commentBody: {
    backgroundColor: '#f1f2f6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#222',
    lineHeight: 18,
  },
  commentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#888',
    marginRight: 8,
  },
  footerActionText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
  },
  footerActionTextLiked: {
    color: '#ff4757', // Chuyển sang màu đỏ khi đã thích bình luận
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 10,
    color: '#111',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
