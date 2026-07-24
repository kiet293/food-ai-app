import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SharePostModalProps {
  visible: boolean;
  onClose: () => void;
  postTitle?: string;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  visible,
  onClose,
  postTitle,
}) => {
  const handleCopyLink = () => {
    Alert.alert('Thành công 🎉', 'Đã sao chép liên kết bài viết!');
    onClose();
  };

  const handleShareApp = (platform: string) => {
    Alert.alert('Chia sẻ', `Đang chia sẻ "${postTitle}" qua ${platform}...`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Chia Sẻ Bài Viết</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.postName} numberOfLines={2}>
            "{postTitle}"
          </Text>

          <View style={styles.shareOptions}>
            <TouchableOpacity style={styles.optionBtn} onPress={handleCopyLink}>
              <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="link-outline" size={24} color="#28a745" />
              </View>
              <Text style={styles.optionText}>Sao chép Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={() => handleShareApp('Facebook')}>
              <View style={[styles.iconBg, { backgroundColor: '#e7f0ff' }]}>
                <Ionicons name="logo-facebook" size={24} color="#1877f2" />
              </View>
              <Text style={styles.optionText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={() => handleShareApp('Messenger')}>
              <View style={[styles.iconBg, { backgroundColor: '#f0e5ff' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#0084ff" />
              </View>
              <Text style={styles.optionText}>Messenger</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={() => handleShareApp('Khác')}>
              <View style={[styles.iconBg, { backgroundColor: '#f5f5f5' }]}>
                <Ionicons name="share-social-outline" size={24} color="#555" />
              </View>
              <Text style={styles.optionText}>Ứng dụng khác</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  postName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  optionBtn: {
    alignItems: 'center',
  },
  iconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },
});
