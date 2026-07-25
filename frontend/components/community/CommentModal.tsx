import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timeAgo: string;
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postTitle?: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({ visible, onClose, postTitle }) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c1',
      authorName: 'Snappy Foodie',
      authorAvatar: '👨‍🍳',
      text: 'Món này trông hấp dẫn quá! Cho mình xin lượng phô mai chuẩn nhé.',
      timeAgo: '2 giờ trước',
    },
    {
      id: 'c2',
      authorName: 'Amber Eats',
      authorAvatar: '👩‍🍳',
      text: 'Đã thử làm theo và thành công rực rỡ! Cảm ơn chef nhé ❤️',
      timeAgo: '4 giờ trước',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  const handleSend = () => {
    if (!newComment.trim()) return;
    const item: Comment = {
      id: Date.now().toString(),
      authorName: 'Bạn (Tôi)',
      authorAvatar: '🥗',
      text: newComment.trim(),
      timeAgo: 'Vừa xong',
    };
    setComments([item, ...comments]);
    setNewComment('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          {/* List comments */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{item.authorAvatar}</Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={styles.authorName}>{item.authorName}</Text>
                    <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              </View>
            )}
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!newComment.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
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
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
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
});
