import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EMOJI_LIST = ['👨‍🍳', '👩‍🍳', '🥷', '🐱', '🐻', '🦊', '🦁', '🥑', '🍕', '🍣', '☕', '🔥'];

interface ProfileEditModalProps {
  visible: boolean;
  fullName: string;
  username: string;
  avatar: string;
  bio?: string;
  isSaving?: boolean;
  isDarkMode: boolean;
  dynamicBg: string;
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  dynamicBorderColor: string;
  onClose: () => void;
  onPickImage: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSaveFullName: (newName: string) => void;
  onOpenBioModal: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  fullName,
  username,
  avatar,
  bio,
  isSaving = false,
  isDarkMode,
  dynamicBg,
  dynamicTextColor,
  dynamicSubTextColor,
  dynamicBorderColor,
  onClose,
  onPickImage,
  onSelectEmoji,
  onSaveFullName,
  onOpenBioModal,
}) => {
  // Modal con chỉnh sửa Tên
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [tempName, setTempName] = useState(fullName);

  // Modal con chọn Emoji đại diện
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const isUrl = (str: string) => str && (str.startsWith('http://') || str.startsWith('https://'));

  const handleAvatarPress = () => {
    Alert.alert(
      "Thay đổi ảnh đại diện",
      "Bạn muốn sử dụng ảnh thật từ thư viện hay Emoji đại diện?",
      [
        {
          text: "📸 Tải ảnh từ điện thoại...",
          onPress: onPickImage,
        },
        {
          text: "👨‍🍳 Chọn Emoji đại diện...",
          onPress: () => setIsEmojiPickerOpen(true),
        },
        { text: "Hủy", style: "cancel" },
      ]
    );
  };

  const handleCopyLink = () => {
    Alert.alert("Thành công! 📋", `Đã sao chép liên kết foodai.com/@${username} vào bộ nhớ tạm.`);
  };

  const handleConfirmSaveName = () => {
    if (!tempName.trim()) {
      Alert.alert("Lỗi", "Tên hiển thị không được để trống!");
      return;
    }
    onSaveFullName(tempName.trim());
    setIsEditNameOpen(false);
  };

  const cardBg = isDarkMode ? '#1e1e1e' : '#ffffff';
  const pageBg = isDarkMode ? '#121212' : '#f8f9fa';

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]}>
        {/* Top Header */}
        <View style={[styles.headerBar, { backgroundColor: dynamicBg, borderBottomColor: dynamicBorderColor }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={dynamicTextColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: dynamicTextColor }]}>Sửa hồ sơ</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarCircleWrapper} onPress={handleAvatarPress} activeOpacity={0.85}>
              {isUrl(avatar) ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarEmojiBox}>
                  <Text style={styles.avatarEmojiText}>{avatar || '👨‍🍳'}</Text>
                </View>
              )}
              {/* Camera Icon Overlay */}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={22} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAvatarPress} style={{ marginTop: 10 }}>
              <Text style={styles.changePhotoText}>Thay đổi ảnh</Text>
            </TouchableOpacity>
          </View>

          {/* Group 1: Thông tin tài khoản (Tên, ID, Link) */}
          <View style={[styles.cardGroup, { backgroundColor: cardBg }]}>
            {/* Row 1: Tên */}
            <TouchableOpacity
              style={[styles.rowItem, { borderBottomColor: dynamicBorderColor }]}
              onPress={() => {
                setTempName(fullName);
                setIsEditNameOpen(true);
              }}
            >
              <Text style={[styles.rowLabel, { color: dynamicSubTextColor }]}>Tên</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: dynamicTextColor }]} numberOfLines={1}>
                  {fullName || 'Gia Kiệt'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#aaa" />
              </View>
            </TouchableOpacity>

            {/* Row 2: TikTok / FoodAI ID */}
            <View style={[styles.rowItem, { borderBottomColor: dynamicBorderColor }]}>
              <Text style={[styles.rowLabel, { color: dynamicSubTextColor }]}>FoodAI ID</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: dynamicTextColor }]} numberOfLines={1}>
                  {username}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#aaa" />
              </View>
            </View>

            {/* Row 3: Link hồ sơ + Icon Copy */}
            <TouchableOpacity style={styles.rowItem} onPress={handleCopyLink}>
              <Text style={[styles.rowValueLink, { color: dynamicTextColor }]} numberOfLines={1}>
                foodai.com/@{username}
              </Text>
              <Ionicons name="copy-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: dynamicSubTextColor }]}>Thông tin cơ bản</Text>

          {/* Group 2: Thông tin cơ bản (Tiểu sử, Liên kết) */}
          <View style={[styles.cardGroup, { backgroundColor: cardBg }]}>
            {/* Row 1: Tiểu sử */}
            <TouchableOpacity
              style={[styles.rowItem, { borderBottomColor: dynamicBorderColor }]}
              onPress={() => {
                onClose();
                onOpenBioModal();
              }}
            >
              <Text style={[styles.rowLabel, { color: dynamicSubTextColor }]}>Tiểu sử</Text>
              <View style={styles.rowRight}>
                <Text
                  style={[
                    styles.rowValue,
                    { color: bio && bio.trim().length > 0 ? dynamicTextColor : '#aaa' },
                  ]}
                  numberOfLines={1}
                >
                  {bio && bio.trim().length > 0 ? bio : 'Thêm tiểu sử'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#aaa" />
              </View>
            </TouchableOpacity>

            {/* Row 2: Liên kết */}
            <TouchableOpacity style={styles.rowItem}>
              <Text style={[styles.rowLabel, { color: dynamicSubTextColor }]}>Liên kết</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: '#aaa' }]}>Thêm liên kết</Text>
                <Ionicons name="chevron-forward" size={18} color="#aaa" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* SUB-MODAL 1: Sửa Tên hiển thị */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isEditNameOpen}
          onRequestClose={() => setIsEditNameOpen(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.promptBackdrop}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.promptContent, { backgroundColor: dynamicBg }]}
              >
                <Text style={[styles.promptTitle, { color: dynamicTextColor }]}>Sửa tên hiển thị</Text>

                <TextInput
                  style={[styles.promptInput, { color: dynamicTextColor, borderColor: dynamicBorderColor }]}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Nhập tên mới..."
                  placeholderTextColor="#aaa"
                  autoFocus
                />

                <View style={styles.promptBtnRow}>
                  <TouchableOpacity
                    style={[styles.promptBtn, { backgroundColor: '#eee' }]}
                    onPress={() => setIsEditNameOpen(false)}
                  >
                    <Text style={{ color: '#333', fontWeight: '600' }}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.promptBtn, { backgroundColor: '#fe2c55' }]}
                    onPress={handleConfirmSaveName}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* SUB-MODAL 2: Chọn Emoji đại diện */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEmojiPickerOpen}
          onRequestClose={() => setIsEmojiPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.promptBackdrop}
            activeOpacity={1}
            onPress={() => setIsEmojiPickerOpen(false)}
          >
            <View style={[styles.emojiSheetContent, { backgroundColor: dynamicBg }]}>
              <Text style={[styles.promptTitle, { color: dynamicTextColor, marginBottom: 16 }]}>
                Chọn Emoji đại diện 👨‍🍳
              </Text>
              <View style={styles.emojiGrid}>
                {EMOJI_LIST.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiCell,
                      avatar === emoji && styles.emojiCellSelected,
                    ]}
                    onPress={() => {
                      onSelectEmoji(emoji);
                      setIsEmojiPickerOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarCircleWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEmojiBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmojiText: {
    fontSize: 52,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1396ed',
  },
  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  rowValue: {
    fontSize: 15,
    marginRight: 6,
  },
  rowValueLink: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  // Sub-modal prompt styles
  promptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  promptTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  promptInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  promptBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  promptBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  // Emoji Sheet
  emojiSheetContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 20,
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiCellSelected: {
    backgroundColor: '#ffe5eb',
    borderWidth: 2,
    borderColor: '#fe2c55',
  },
});
