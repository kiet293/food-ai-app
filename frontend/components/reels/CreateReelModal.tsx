import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadReel } from '@/services/reel/reelService';

interface CreateReelModalProps {
  visible: boolean;
  onClose: () => void;
  onReelCreated: () => void;
}

export default function CreateReelModal({
  visible,
  onClose,
  onReelCreated,
}: CreateReelModalProps) {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện để tải video lên!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Lỗi chọn video:', err);
      Alert.alert('Lỗi', 'Không thể mở thư viện video');
    }
  };

  const handlePublish = async () => {
    if (!videoUri) {
      Alert.alert('Thông báo', 'Vui lòng chọn 1 clip video để đăng!');
      return;
    }

    setIsUploading(true);
    try {
      await uploadReel(videoUri, caption);
      Alert.alert('Thành công! 🎉', 'Video Reels của bạn đã được đăng lên hệ thống.');
      setVideoUri(null);
      setCaption('');
      onReelCreated();
      onClose();
    } catch (error: any) {
      Alert.alert('Thất bại', error.message || 'Đăng video thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onClose} disabled={isUploading}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Tạo Video Reels mới 🎬</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Video Selector */}
            <TouchableOpacity
              style={styles.videoPickerBox}
              onPress={handleSelectVideo}
              disabled={isUploading}
            >
              {videoUri ? (
                <View style={styles.videoSelectedState}>
                  <Ionicons name="checkmark-circle" size={42} color="#28a745" />
                  <Text style={styles.videoSelectedText}>Đã chọn video thành công!</Text>
                  <Text style={styles.videoPathText} numberOfLines={1}>
                    {videoUri.split('/').pop()}
                  </Text>
                  <Text style={styles.changeVideoText}>Nhấn để đổi video khác</Text>
                </View>
              ) : (
                <View style={styles.emptyVideoState}>
                  <Ionicons name="videocam" size={48} color="#aaa" />
                  <Text style={styles.pickerTitle}>Chọn video từ điện thoại</Text>
                  <Text style={styles.pickerSub}>Hỗ trợ các định dạng .mp4, .mov (Tối đa 60s)</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Caption Input */}
            <Text style={styles.inputLabel}>Viết mô tả ngắn (kèm hashtag):</Text>
            <TextInput
              style={styles.input}
              value={caption}
              onChangeText={setCaption}
              placeholder="Hôm nay nấu món gì ngon... #cooking #delicious"
              multiline
              numberOfLines={3}
              editable={!isUploading}
            />

            {/* Publish Button */}
            <TouchableOpacity
              style={[styles.publishBtn, isUploading && styles.disabledBtn]}
              onPress={handlePublish}
              disabled={isUploading}
            >
              {isUploading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.publishBtnText}>Đang tải video lên Cloudinary...</Text>
                </View>
              ) : (
                <Text style={styles.publishBtnText}>🚀 Đăng Lên Reels Ngay</Text>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  videoPickerBox: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  emptyVideoState: {
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginTop: 10,
  },
  pickerSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  videoSelectedState: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  videoSelectedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#28a745',
    marginTop: 8,
  },
  videoPathText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  changeVideoText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: '#111',
  },
  publishBtn: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: '#adc6ad',
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
