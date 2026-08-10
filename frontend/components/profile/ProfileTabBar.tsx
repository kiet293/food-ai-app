import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ProfileTabType = 'posted' | 'saved' | 'liked' | 'private';

interface ProfileTabBarProps {
  activeTab: ProfileTabType;
  isDarkMode: boolean;
  dynamicBorderColor: string;
  onTabChange: (tab: ProfileTabType) => void;
}

export const ProfileTabBar: React.FC<ProfileTabBarProps> = ({
  activeTab,
  isDarkMode,
  dynamicBorderColor,
  onTabChange,
}) => {
  return (
    <View style={[styles.tabBarRow, { borderBottomColor: dynamicBorderColor }]}>
      <TouchableOpacity
        style={[styles.tabIconBtn, activeTab === 'posted' && styles.activeTabLine]}
        onPress={() => onTabChange('posted')}
      >
        <Ionicons
          name="grid-outline"
          size={22}
          color={activeTab === 'posted' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabIconBtn, activeTab === 'saved' && styles.activeTabLine]}
        onPress={() => onTabChange('saved')}
      >
        <Ionicons
          name="folder-open-outline"
          size={22}
          color={activeTab === 'saved' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabIconBtn, activeTab === 'liked' && styles.activeTabLine]}
        onPress={() => onTabChange('liked')}
      >
        <Ionicons
          name="heart-outline"
          size={24}
          color={activeTab === 'liked' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabIconBtn, activeTab === 'private' && styles.activeTabLine]}
        onPress={() => onTabChange('private')}
      >
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={activeTab === 'private' ? (isDarkMode ? '#fff' : '#000') : '#aaa'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginTop: 6,
  },
  tabIconBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
});
