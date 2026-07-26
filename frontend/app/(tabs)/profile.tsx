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
  Switch,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getUserProfile, logoutUser, updateUserProfile, updateUserAvatar } from '../../services/auth/authService';
import * as ImagePicker from 'expo-image-picker';
import { getSavedRecipes } from '../../services/recipe/recipeService';
import { useAuth } from '../_layout';

const EMOJI_LIST = ['👨‍🍳', '👩‍🍳', '🥷', '🐱', '🐻', '🦊', '🦁', '🥑', '🍕', '🍣', '☕', '🔥'];

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [userInfo, setUserInfo] = useState<{ username: string; joined_at: string; full_name: string; avatar: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);

  // Dark Mode Toggle State (Option 4)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🍳');
  const [isSaving, setIsSaving] = useState(false);

  // --- HÀM XỬ LÝ ẢNH ĐẠI DIỆN ---
  const isUrl = (str: string) => str && (str.startsWith('http://') || str.startsWith('https://'));

  const handleEditAvatarPress = () => {
    Alert.alert(
      "Cập nhật ảnh đại diện",
      "Chọn một thao tác",
      [
        { text: "Tải ảnh lên...", onPress: pickImage },
        { text: "Gỡ ảnh", onPress: removeImage, style: "destructive" },
        { text: "Hủy", style: "cancel" }
      ]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Quyền truy cập", "Bạn cần cấp quyền để mở thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsLoading(true);
    try {
      const response = await updateUserAvatar(uri);
      if (response && response.avatar_url) {
        setUserInfo(prev => prev ? { ...prev, avatar: response.avatar_url } : null);
        Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật!");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile(userInfo?.full_name || '', '👨‍🍳');
      setUserInfo(prev => prev ? { ...prev, avatar: '👨‍🍳' } : null);
      Alert.alert("Thành công", "Đã gỡ ảnh đại diện.");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gỡ ảnh đại diện.");
    } finally {
      setIsLoading(false);
    }
  };
  // ---------------------------------

  const loadProfile = async () => {
    setIsLoading(true);
    const data = await getUserProfile();
    if (data) {
      setUserInfo(data);
      setEditFullName(data.full_name);
      setSelectedAvatar(data.avatar);
    }
    
    try {
      const recipes = await getSavedRecipes();
      setSavedCount(recipes.length || 0);
    } catch (e) {
      console.warn("Lỗi tải số lượng công thức:", e);
    }
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

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

  const dynamicBg = isDarkMode ? '#121212' : '#f8f9fa';
  const dynamicCardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const dynamicTextColor = isDarkMode ? '#fff' : '#111';
  const dynamicSubTextColor = isDarkMode ? '#aaa' : '#777';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicBg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={dynamicBg} />

      {isLoading && !userInfo ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={[styles.loadingText, { color: dynamicSubTextColor }]}>Đang tải thông tin cá nhân...</Text>
        </View>
      ) : userInfo ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Banner */}
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
          </View>

          {/* User Profile Card */}
          <View style={[styles.profileHeaderCard, { backgroundColor: dynamicCardBg }]}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatarContainer}>
                  {userInfo.avatar && isUrl(userInfo.avatar) ? (
                    <Image source={{ uri: userInfo.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{userInfo.avatar}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.editAvatarIcon} onPress={handleEditAvatarPress}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fullNameText, { color: dynamicTextColor }]}>{userInfo.full_name}</Text>
            <Text style={styles.usernameText}>@{userInfo.username}</Text>
            <Text style={styles.joinedText}>📅 Tham gia: {userInfo.joined_at}</Text>

            {/* Stats Row Pepper Style */}
            <View style={[styles.statsRow, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f8fdf9' }]}>
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: dynamicTextColor }]}>{savedCount}</Text>
                <Text style={styles.statLabel}>Đã lưu</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
                  {savedCount >= 8 ? 'Master' : savedCount >= 4 ? 'Pro Cook' : 'Tập sự'}
                </Text>
                <Text style={styles.statLabel}>Cấp độ</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: dynamicTextColor }]}>
                  🏆 {savedCount >= 8 ? '3' : savedCount >= 4 ? '2' : savedCount > 0 ? '1' : '0'}
                </Text>
                <Text style={styles.statLabel}>Danh hiệu</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color="#28a745" style={{ marginRight: 6 }} />
                <Text style={styles.editButtonText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Huy hiệu của tôi */}
          <View style={[styles.section, { backgroundColor: dynamicCardBg }]}>
            <Text style={[styles.sectionTitle, { color: dynamicTextColor }]}>🏅 Huy hiệu đạt được</Text>
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

          {/* Section: Cài đặt & Dark Mode Toggle */}
          <View style={[styles.section, { backgroundColor: dynamicCardBg }]}>
            <Text style={[styles.sectionTitle, { color: dynamicTextColor }]}>⚙️ Cài đặt & Trải nghiệm</Text>
            
            {/* Dark Mode Switch (Option 4) */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIconCircle, { backgroundColor: isDarkMode ? '#333' : '#e8f5e9' }]}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color="#28a745" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: dynamicTextColor }]}>Giao diện Tối (Dark Mode)</Text>
                <Text style={{ fontSize: 11, color: dynamicSubTextColor }}>{isDarkMode ? 'Đang bật Chế độ tối' : 'Đang bật Chế độ sáng'}</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#ddd', true: '#28a745' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={[styles.settingIconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="notifications-outline" size={20} color="#28a745" />
              </View>
              <Text style={[styles.settingText, { color: dynamicTextColor }]}>Thông báo ứng dụng</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={[styles.settingIconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#28a745" />
              </View>
              <Text style={[styles.settingText, { color: dynamicTextColor }]}>Quyền riêng tư & Bảo mật</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={[styles.settingIconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#28a745" />
              </View>
              <Text style={[styles.settingText, { color: dynamicTextColor }]}>Liên hệ hỗ trợ & Trợ giúp</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải thông tin. Vui lòng thử lại sau.</Text>
        </View>
      )}

      {/* Edit Profile Modal */}
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

                <Text style={styles.inputLabel}>Tên hiển thị của bạn:</Text>
                <TextInput
                  style={styles.input}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Nhập tên hiển thị mới..."
                />

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
    backgroundColor: '#f8f9fa',
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
    fontSize: 15,
  },
  bannerContainer: {
    height: 140,
    position: 'relative',
    backgroundColor: '#28a745',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  profileHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: -50,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#e8f5e9',
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  avatarText: {
    fontSize: 42,
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fullNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 8,
  },
  joinedText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f8fdf9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  statLabel: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
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
    borderColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  editButtonText: {
    color: '#28a745',
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
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeActive: {
    borderColor: '#28a745',
    backgroundColor: '#f8fdf9',
  },
  badgeInactive: {
    borderColor: '#eee',
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 9,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 11,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff4757',
    fontSize: 15,
  },
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
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
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
    color: '#111',
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
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#28a745',
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
    color: '#333',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});