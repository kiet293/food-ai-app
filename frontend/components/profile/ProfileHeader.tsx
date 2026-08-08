import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  fullName: string;
  dynamicTextColor: string;
  dynamicBorderColor: string;
  onOpenEditModal: () => void;
  onOpenSettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  fullName,
  dynamicTextColor,
  dynamicBorderColor,
  onOpenEditModal,
  onOpenSettings,
}) => {
  return (
    <View style={[styles.topHeader, { borderBottomColor: dynamicBorderColor }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={onOpenEditModal}>
        <Ionicons name="create-outline" size={24} color={dynamicTextColor} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerTitleBox} onPress={onOpenEditModal}>
        <Text style={[styles.headerTitle, { color: dynamicTextColor }]} numberOfLines={1}>
          {fullName || 'Gia Kiệt'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={dynamicTextColor} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <View style={styles.rightIconsRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings}>
          <Ionicons name="menu-outline" size={28} color={dynamicTextColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  rightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
  },
});
