import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileSettingsDrawerProps {
  visible: boolean;
  isDarkMode: boolean;
  dynamicBg: string;
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  dynamicBorderColor: string;
  onClose: () => void;
  onToggleDarkMode: (val: boolean) => void;
  onOpenEditModal: () => void;
  onLogout: () => void;
}

export const ProfileSettingsDrawer: React.FC<ProfileSettingsDrawerProps> = ({
  visible,
  isDarkMode,
  dynamicBg,
  dynamicTextColor,
  dynamicSubTextColor,
  dynamicBorderColor,
  onClose,
  onToggleDarkMode,
  onOpenEditModal,
  onLogout,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.drawerContainer, { backgroundColor: dynamicBg }]}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerHandleBar} />
            <Text style={[styles.drawerTitle, { color: dynamicTextColor }]}>Cài đặt & Quyền riêng tư ⚙️</Text>
          </View>

          {/* Menu Option 1: Bật/Tắt Dark Mode */}
          <View style={[styles.menuOptionRow, { borderBottomColor: dynamicBorderColor }]}>
            <View style={styles.optionLeft}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color="#fe2c55" style={{ marginRight: 12 }} />
              <Text style={[styles.optionText, { color: dynamicTextColor }]}>Chế độ nền Tối (Dark Mode)</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={onToggleDarkMode}
              trackColor={{ false: '#ddd', true: '#fe2c55' }}
              thumbColor="#fff"
            />
          </View>

          {/* Menu Option 2: Chỉnh sửa hồ sơ */}
          <TouchableOpacity
            style={[styles.menuOptionRow, { borderBottomColor: dynamicBorderColor }]}
            onPress={() => {
              onClose();
              onOpenEditModal();
            }}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="person-outline" size={22} color="#28a745" style={{ marginRight: 12 }} />
              <Text style={[styles.optionText, { color: dynamicTextColor }]}>Chỉnh sửa hồ sơ cá nhân</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
          </TouchableOpacity>

          {/* Menu Option 3: Thông tin ứng dụng */}
          <View style={[styles.menuOptionRow, { borderBottomColor: dynamicBorderColor }]}>
            <View style={styles.optionLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#007bff" style={{ marginRight: 12 }} />
              <Text style={[styles.optionText, { color: dynamicTextColor }]}>Phiên bản ứng dụng (v1.0.0)</Text>
            </View>
            <Text style={{ color: dynamicSubTextColor, fontSize: 13 }}>FoodAI App</Text>
          </View>

          {/* Menu Option 4: Đăng xuất */}
          <TouchableOpacity style={styles.logoutRowBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={22} color="#dc3545" style={{ marginRight: 12 }} />
            <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  drawerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  drawerHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  logoutRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc3545',
  },
});
