import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { getUserProfile, logoutUser, updateUserProfile } from '../../services/authService';
import { getSavedRecipes } from '../../services/aiService';
import { useAuth } from '../_layout';

// Danh sách Emoji để người dùng lựa chọn làm ảnh đại diện
const EMOJI_LIST = ['👨‍🍳', '👩‍🍳', '🥷', '🐱', '🐻', '🦊', '🦁', '🥑', '🍕', '🍣', '☕', '🔥'];

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  // State lưu thông tin từ Server trả về
  const [userInfo, setUserInfo] = useState<{ username: string; joined_at: string; full_name: string; avatar: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);

  // State phục vụ cho chức năng Chỉnh sửa (Modal)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🍳');
  const [isSaving, setIsSaving] = useState(false);

  // Hàm tải dữ liệu hồ sơ cá nhân
  const loadProfile = async () => {
    setIsLoading(true);
    const data = await getUserProfile();
    if (data) {
      setUserInfo(data);
      setEditFullName(data.full_name);
      setSelectedAvatar(data.avatar);
    }
    
    // Tải số lượng công thức đã lưu trong sổ tay
    try {
      const recipes = await getSavedRecipes();
      setSavedCount(recipes.length || 0);
    } catch (e) {
      console.warn("Lỗi tải số lượng công thức:", e);
    }
    setIsLoading(false);
  };

  // Tự động tải lại thông tin mỗi khi tab Profile được hiển thị
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // Xử lý gửi thông tin cập nhật lên Backend
  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert("Lỗi", "Tên hiển thị không được để trống!");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(editFullName, selectedAvatar);
      Alert.alert("Thành công! 🎉", "Hồ sơ của bạn đã được cập nhật.");
      setIsEditModalVisible(false);
      loadProfile();
    } catch (error: any) {
      Alert.alert("Thất bại", "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn thoát tài khoản không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logoutUser();
            signOut();
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f3ea" />

      {isLoading && !userInfo ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
        </View>
      ) : userInfo ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Banner */}
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
          </View>

          {/* User Profile Info Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{userInfo.avatar}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.fullNameText}>{userInfo.full_name}</Text>
            <Text style={styles.usernameText}>@{userInfo.username}</Text>
            <Text style={styles.joinedText}>📅 Tham gia: {userInfo.joined_at}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>{savedCount}</Text>
                <Text style={styles.statLabel}>Đã lưu</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>
                  {savedCount >= 8 ? 'Master' : savedCount >= 4 ? 'Pro Cook' : 'Tập sự'}
                </Text>
                <Text style={styles.statLabel}>Cấp độ</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>🏆 {savedCount >= 8 ? '3' : savedCount >= 4 ? '2' : savedCount > 0 ? '1' : '0'}</Text>
                <Text style={styles.statLabel}>Danh hiệu</Text>
              </View>
            </View>

            {/* Action Buttons inside Card */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={18} color="#2ecc71" style={styles.buttonIcon} />
                <Text style={styles.editButtonText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <MaterialIcons name="logout" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Danh hiệu đạt được */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏅 Huy hiệu của tôi</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badgeCard, savedCount > 0 ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeEmoji}>🍳</Text>
                <Text style={styles.badgeName}>Nhập Môn</Text>
                <Text style={styles.badgeDesc}>Lưu công thức đầu tiên</Text>
              </View>
              
              <View style={[styles.badgeCard, savedCount >= 4 ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeEmoji}>🥗</Text>
                <Text style={styles.badgeName}>Nội Trợ Pro</Text>
                <Text style={styles.badgeDesc}>Lưu từ 4 công thức</Text>
              </View>
              
              <View style={[styles.badgeCard, savedCount >= 8 ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeEmoji}>👑</Text>
                <Text style={styles.badgeName}>Siêu Đầu Bếp</Text>
                <Text style={styles.badgeDesc}>Lưu từ 8 công thức</Text>
              </View>
            </View>
          </View>

          {/* Section: Cài đặt & Hỗ trợ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Cài đặt & Tiện ích</Text>
            
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconCircle}>
                <MaterialIcons name="notifications-none" size={20} color="#1a3a1a" />
              </View>
              <Text style={styles.settingText}>Thông báo ứng dụng</Text>
              <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconCircle}>
                <MaterialIcons name="security" size={20} color="#1a3a1a" />
              </View>
              <Text style={styles.settingText}>Quyền riêng tư & Bảo mật</Text>
              <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconCircle}>
                <MaterialIcons name="color-lens" size={20} color="#1a3a1a" />
              </View>
              <Text style={styles.settingText}>Giao diện (Sáng/Tối)</Text>
              <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconCircle}>
                <MaterialIcons name="help-outline" size={20} color="#1a3a1a" />
              </View>
              <Text style={styles.settingText}>Liên hệ hỗ trợ & Trợ giúp</Text>
              <MaterialIcons name="chevron-right" size={24} color="#adc6ad" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải thông tin. Vui lòng thử lại sau.</Text>
        </View>
      )}

      {/* ==================== MODAL CHỈNH SỬA HỒ SƠ ==================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ 📝</Text>

                {/* Mục chọn Avatar */}
                <Text style={styles.inputLabel}>Chọn ảnh đại diện mới:</Text>
                <View style={styles.emojiListContainer}>
                  <FlatList
                    data={EMOJI_LIST}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.emojiItem,
                          selectedAvatar === item && styles.selectedEmojiItem
                        ]}
                        onPress={() => setSelectedAvatar(item)}
                      >
                        <Text style={styles.emojiText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>

                {/* Mục nhập Tên hiển thị */}
                <Text style={styles.inputLabel}>Tên hiển thị của bạn:</Text>
                <TextInput
                  style={styles.input}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Nhập tên hiển thị mới..."
                />

                {/* Các nút lệnh */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setIsEditModalVisible(false)}
                    disabled={isSaving}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Lưu lại</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#8aab8a',
    fontSize: 15,
  },
  bannerContainer: {
    height: 140,
    position: 'relative',
    backgroundColor: '#dde8dd',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 58, 26, 0.15)',
  },
  profileHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -50,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'absolute',
    top: -46,
    alignSelf: 'center',
  },
  avatarBorder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarContainer: {
    width: 82,
    height: 82,
    backgroundColor: '#f0f4f0',
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8f0e8',
  },
  avatarText: {
    fontSize: 42,
  },
  fullNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a3a1a',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 14,
    color: '#8aab8a',
    fontWeight: '500',
    marginBottom: 8,
  },
  joinedText: {
    fontSize: 12,
    color: '#adc6ad',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f7fbf7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f0e8',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a3a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#8aab8a',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#dde8dd',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#2ecc71',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  editButtonText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 6,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1a3a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a3a1a',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: '#f7fbf7',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeActive: {
    borderColor: '#2ecc71',
    backgroundColor: '#f1fcf6',
  },
  badgeInactive: {
    borderColor: '#e8f0e8',
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a3a1a',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 9,
    color: '#8aab8a',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 11,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f0',
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: '#1a3a1a',
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff4757',
    fontSize: 15,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a3a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f4f0',
    borderWidth: 1,
    borderColor: '#dde8dd',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
    color: '#1a3a1a',
  },
  emojiListContainer: {
    marginBottom: 20,
    height: 60,
  },
  emojiItem: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#f0f4f0',
    marginRight: 8,
  },
  selectedEmojiItem: {
    backgroundColor: '#f1fcf6',
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  emojiText: {
    fontSize: 24,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f4f0',
  },
  cancelButtonText: {
    color: '#1a3a1a',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});