import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getUserProfile, logoutUser, updateUserProfile } from '../../services/authService';
import { useAuth } from '../_layout';

// Danh sách Emoji để người dùng lựa chọn làm ảnh đại diện
const EMOJI_LIST = ['👨‍🍳', '👩‍🍳', '🥷', '🐱', '🐻', '🦊', '🦁', '🥑', '🍕', '🍣', '☕', '🔥'];

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  // State lưu thông tin từ Server trả về
  const [userInfo, setUserInfo] = useState<{ username: string; joined_at: string; full_name: string; avatar: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      // Đồng bộ dữ liệu vào form sửa đổi luôn
      setEditFullName(data.full_name);
      setSelectedAvatar(data.avatar);
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
      setIsEditModalVisible(false); // Đóng Modal
      loadProfile(); // Tải lại giao diện với thông tin mới tinh
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
            await logoutUser(); // Xóa Token trong ví
            signOut(); // Báo cho hệ thống biết là đã đăng xuất
            // Đẩy về trang đăng nhập
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Hồ sơ cá nhân 👤</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 50 }} />
      ) : userInfo ? (
        <View style={styles.card}>
          {/* Vùng hiển thị Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInfo.avatar}</Text>
          </View>

          {/* Hiển thị Tên đầy đủ và Username */}
          <Text style={styles.fullNameText}>{userInfo.full_name}</Text>
          <Text style={styles.usernameText}>@{userInfo.username}</Text>
          <Text style={styles.infoText}>Thành viên từ: {userInfo.joined_at}</Text>

          <View style={styles.divider} />

          {/* Nút Mở Modal Chỉnh Sửa */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Text style={styles.editButtonText}>✏️ Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>

          {/* Nút Đăng xuất */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>Không thể tải thông tin. Vui lòng thử lại sau.</Text>
      )}

      {/* ==================== MODAL CHỈNH SỬA HỒ SƠ ==================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        {/* Khi người dùng bấm vào vùng nền đen mờ, bàn phím sẽ tự động thụt xuống */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          {/* Áo giáp đẩy giao diện lên khi bàn phím xuất hiện */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            {/* Để TouchableWithoutFeedback không bị tắt mất chức năng bấm của các nút bên trong, 
                ta cần thêm một thẻ View hứng sự kiện bấm vô hình ở đây */}
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
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#e9ecef',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 45,
  },
  fullNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  usernameText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff4757',
    marginTop: 20,
  },
  // --- STYLES CHO MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 25,
    color: '#333',
  },
  emojiListContainer: {
    marginBottom: 20,
    height: 65,
  },
  emojiItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: '#f1f2f6',
    marginRight: 10,
  },
  selectedEmojiItem: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  emojiText: {
    fontSize: 26,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f2f6',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#57606f',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})