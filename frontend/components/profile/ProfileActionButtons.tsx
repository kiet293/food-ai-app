import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ProfileActionButtonsProps {
  bio?: string;
  isDarkMode: boolean;
  dynamicTextColor: string;
  dynamicSubTextColor: string;
  onOpenEditModal: () => void;
  onOpenBioModal: () => void;
  onShareProfile: () => void;
}

export const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  bio,
  isDarkMode,
  dynamicTextColor,
  dynamicSubTextColor,
  onOpenEditModal,
  onOpenBioModal,
  onShareProfile,
}) => {
  const hasBio = bio && bio.trim().length > 0;

  return (
    <View style={styles.actionButtonsSection}>
      {/* 1. Hiển thị Tiểu sử nếu đã có, bấm vào để sửa/xóa (TikTok Style) */}
      {hasBio ? (
        <TouchableOpacity style={styles.bioTextWrapper} onPress={onOpenBioModal} activeOpacity={0.7}>
          <Text style={[styles.bioDisplayText, { color: dynamicTextColor }]} numberOfLines={3}>
            {bio}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.addBioPill, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f8f9fa' }]}
          onPress={onOpenBioModal}
          activeOpacity={0.8}
        >
          <Text style={[styles.addBioText, { color: dynamicSubTextColor }]}>+ Thêm tiểu sử</Text>
        </TouchableOpacity>
      )}

      {/* 2. Hàng nút Hành động (Chỉnh sửa hồ sơ / Chia sẻ hồ sơ) */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f1f2f5' }]}
          onPress={onOpenEditModal}
        >
          <Text style={[styles.actionBtnText, { color: dynamicTextColor }]}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f1f2f5' }]}
          onPress={onShareProfile}
        >
          <Text style={[styles.actionBtnText, { color: dynamicTextColor }]}>Chia sẻ hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtonsSection: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  bioTextWrapper: {
    marginVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bioDisplayText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
  },
  addBioPill: {
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addBioText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
