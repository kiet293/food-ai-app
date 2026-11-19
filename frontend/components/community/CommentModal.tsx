import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Comment,
  createReelComment,
  fetchReelComments,
  toggleCommentLike,
} from '@/services/reel/reelService';

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postTitle?: string;
  reelDbId?: number;
  onCommentAdded?: (newCount: number) => void;
}

interface CommentThread {
  root: Comment;
  replies: Comment[];
}

const getMockComments = (): Comment[] => [
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
    parentId: 'c1',
  },
];

/** Gom danh sách phẳng từ API thành các thread như TikTok. Reply nhiều tầng
 * vẫn được đặt trong cùng thread để giao diện không bị thụt lề vô hạn. */
const buildCommentThreads = (comments: Comment[]): CommentThread[] => {
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const threads = comments
    .filter((comment) => !comment.parentId || !commentById.has(comment.parentId))
    .map((root) => ({ root, replies: [] as Comment[] }));
  const threadByRootId = new Map(threads.map((thread) => [thread.root.id, thread]));

  comments.forEach((comment) => {
    if (!comment.parentId || !commentById.has(comment.parentId)) return;

    let parentId = comment.parentId;
    const visited = new Set<string>([comment.id]);

    while (commentById.get(parentId)?.parentId && !visited.has(parentId)) {
      visited.add(parentId);
      parentId = commentById.get(parentId)!.parentId!;
    }

    threadByRootId.get(parentId)?.replies.push(comment);
  });

  return threads;
};

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  reelDbId,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<any>(null);

  const threads = useMemo(() => buildCommentThreads(comments), [comments]);
  const authorById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment.authorName])),
    [comments],
  );

  useEffect(() => {
    if (!visible) return;

    setReplyTo(null);
    setNewComment('');

    if (!reelDbId) {
      setComments(getMockComments());
      return;
    }

    let isActive = true;
    setIsLoading(true);
    fetchReelComments(reelDbId)
      .then((data) => {
        if (isActive) setComments(data);
      })
      .catch((error) => console.error('Lỗi khi tải bình luận:', error))
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [visible, reelDbId]);

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleLikeComment = async (commentId: string) => {
    let previousState: Comment[] = [];
    setComments((currentComments) => {
      previousState = currentComments;
      return currentComments.map((comment) => {
        if (comment.id !== commentId) return comment;

        const isLiked = !comment.isLiked;
        return {
          ...comment,
          isLiked,
          likesCount: isLiked
            ? comment.likesCount + 1
            : Math.max(0, comment.likesCount - 1),
        };
      });
    });

    if (!reelDbId) return;

    try {
      await toggleCommentLike(Number(commentId));
    } catch (error: any) {
      setComments(previousState);
      Alert.alert(
        'Tương tác thất bại',
        error.message || 'Vui lòng đăng nhập để thích bình luận.',
      );
    }
  };

  const handleSend = async () => {
    const content = newComment.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      const createdComment = reelDbId
        ? await createReelComment(
            reelDbId,
            content,
            replyTo ? Number(replyTo.id) : undefined,
          )
        : {
            id: Date.now().toString(),
            authorName: 'Bạn',
            authorAvatar: '🥗',
            text: content,
            parentId: replyTo?.id,
            timeAgo: 'Vừa xong',
            likesCount: 0,
            isLiked: false,
          };

      setComments((currentComments) =>
        createdComment.parentId
          ? [...currentComments, createdComment]
          : [createdComment, ...currentComments],
      );
      onCommentAdded?.(comments.length + 1);
      setNewComment('');
      setReplyTo(null);
    } catch (error: any) {
      Alert.alert(
        'Bình luận thất bại',
        error.message || 'Bạn cần đăng nhập để bình luận.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderAvatar = (comment: Comment, isReply = false) => {
    const avatarSizeStyle = isReply ? styles.replyAvatar : styles.rootAvatar;
    if (comment.authorAvatar?.startsWith('http')) {
      return (
        <Image
          source={{ uri: comment.authorAvatar }}
          style={[styles.avatarImage, avatarSizeStyle]}
        />
      );
    }

    return (
      <View style={[styles.avatarFallback, avatarSizeStyle]}>
        <Text style={isReply ? styles.replyAvatarText : styles.rootAvatarText}>
          {comment.authorAvatar || comment.authorName.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const parentAuthor = comment.parentId ? authorById.get(comment.parentId) : undefined;

    return (
      <View style={[styles.commentRow, isReply && styles.replyRow]}>
        {renderAvatar(comment, isReply)}

        <View style={styles.commentContent}>
          <Text style={styles.authorName} numberOfLines={1}>
            {comment.authorName}
            {parentAuthor ? (
              <Text style={styles.replyingToName}> › {parentAuthor}</Text>
            ) : null}
          </Text>
          <Text style={styles.commentText}>{comment.text}</Text>
          <View style={styles.metadataRow}>
            <Text style={styles.timeText}>{comment.timeAgo}</Text>
            <TouchableOpacity
              onPress={() => startReply(comment)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.replyAction}>Trả lời</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLikeComment(comment.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={comment.isLiked ? 'heart' : 'heart-outline'}
            size={19}
            color={comment.isLiked ? '#fe2c55' : '#6b6b6b'}
          />
          {comment.likesCount > 0 ? (
            <Text style={[styles.likeCount, comment.isLiked && styles.likeCountActive]}>
              {comment.likesCount}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  const renderThread = ({ item }: { item: CommentThread }) => (
    <View style={styles.thread}>
      {renderComment(item.root)}
      {item.replies.length > 0 ? (
        <View style={styles.repliesContainer}>
          {item.replies.map((reply) => (
            <React.Fragment key={reply.id}>{renderComment(reply, true)}</React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{comments.length} bình luận</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={27} color="#161616" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#fe2c55" />
                <Text style={styles.stateText}>Đang tải bình luận...</Text>
              </View>
            ) : (
              <FlatList
                data={threads}
                keyExtractor={(item) => item.root.id}
                renderItem={renderThread}
                contentContainerStyle={[
                  styles.listContent,
                  threads.length === 0 && styles.emptyListContent,
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.centerState}>
                    <Ionicons name="chatbubble-ellipses-outline" size={44} color="#c7c7c7" />
                    <Text style={styles.emptyTitle}>Chưa có bình luận</Text>
                    <Text style={styles.stateText}>Hãy bắt đầu cuộc trò chuyện.</Text>
                  </View>
                }
              />
            )}

            {replyTo ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  Đang trả lời <Text style={styles.replyBannerName}>{replyTo.authorName}</Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={10}>
                  <Ionicons name="close" size={17} color="#777" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.inputBar}>
              <View style={styles.currentUserAvatar}>
                <Text style={styles.currentUserAvatarText}>🥗</Text>
              </View>
              <View style={styles.inputShell}>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholder={replyTo ? `Trả lời ${replyTo.authorName}...` : 'Thêm bình luận...'}
                  placeholderTextColor="#949494"
                  value={newComment}
                  onChangeText={setNewComment}
                  editable={!isSending}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={handleSend}
                />
                <Ionicons name="happy-outline" size={24} color="#202020" />
                <Text style={styles.mentionIcon}>@</Text>
                {newComment.trim() ? (
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={isSending}
                    style={styles.sendButton}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fe2c55" />
                    ) : (
                      <Ionicons name="arrow-up-circle" size={28} color="#fe2c55" />
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  sheet: {
    height: '74%',
    minHeight: 440,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dedede',
    alignSelf: 'center',
    marginTop: 7,
  },
  header: {
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ededed',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 11,
  },
  listContent: {
    paddingTop: 15,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  thread: {
    marginBottom: 20,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyRow: {
    marginTop: 16,
  },
  rootAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  replyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarImage: {
    backgroundColor: '#f1f1f1',
  },
  avatarFallback: {
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rootAvatarText: {
    fontSize: 19,
  },
  replyAvatarText: {
    fontSize: 14,
  },
  commentContent: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 7,
  },
  authorName: {
    color: '#767676',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  replyingToName: {
    color: '#9a9a9a',
    fontWeight: '400',
  },
  commentText: {
    color: '#171717',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 3,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  timeText: {
    color: '#9a9a9a',
    fontSize: 12,
    marginRight: 18,
  },
  replyAction: {
    color: '#747474',
    fontSize: 12,
    fontWeight: '600',
  },
  likeButton: {
    width: 35,
    minHeight: 43,
    alignItems: 'center',
    paddingTop: 2,
  },
  likeCount: {
    color: '#8a8a8a',
    fontSize: 11,
    marginTop: 2,
  },
  likeCountActive: {
    color: '#fe2c55',
  },
  repliesContainer: {
    marginLeft: 20,
    paddingLeft: 19,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#d7d7d7',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#222',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  stateText: {
    color: '#8d8d8d',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 7,
  },
  replyBanner: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 68,
    paddingVertical: 7,
    backgroundColor: '#f7f7f7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e9e9e9',
  },
  replyBannerText: {
    flex: 1,
    color: '#777',
    fontSize: 12,
  },
  replyBannerName: {
    color: '#333',
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 12 : 4,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ededed',
  },
  currentUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf4ec',
    marginRight: 10,
  },
  currentUserAvatarText: {
    fontSize: 17,
  },
  inputShell: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    backgroundColor: '#f4f4f4',
    paddingLeft: 14,
    paddingRight: 9,
  },
  textInput: {
    flex: 1,
    maxHeight: 84,
    color: '#151515',
    fontSize: 14,
    paddingTop: 9,
    paddingBottom: 9,
    paddingRight: 8,
  },
  mentionIcon: {
    color: '#202020',
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '600',
    marginLeft: 9,
  },
  sendButton: {
    marginLeft: 7,
  },
});
