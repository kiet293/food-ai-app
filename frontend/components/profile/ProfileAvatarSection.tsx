import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileAvatarSectionProps {
  avatar: string;
  username: string;
  statusBadge?: string;
  dynamicSubTextColor: string;
  onEditAvatarPress?: () => void;
}

export const ProfileAvatarSection: React.FC<ProfileAvatarSectionProps> = ({
  avatar,
  username,
  statusBadge,
  dynamicSubTextColor,
  onEditAvatarPress,
}) => {
  const isUrl = (str: string) => str && (str.startsWith('http://') || str.startsWith('https://'));

  return (
    <View style={styles.avatarSection}>
      {/* Status Bubble */}
      <View style={styles.statusBubble}>
        <Text style={styles.statusBubbleText}>{statusBadge || 'Tám chuyện nào 💬'}</Text>
      </View>

      {/* Avatar Circle */}
      <TouchableOpacity 
        style={styles.avatarWrapper} 
        onPress={onEditAvatarPress} 
        disabled={!onEditAvatarPress}
        activeOpacity={onEditAvatarPress ? 0.8 : 1}
      >
        {isUrl(avatar) ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarEmoji}>{avatar || '👨‍🍳'}</Text>
        )}
        {/* Plus Story Badge */}
        {onEditAvatarPress && (
          <View style={styles.plusStoryBadge}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Username Handle */}
      <Text style={[styles.handleText, { color: dynamicSubTextColor }]}>
        @{username}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginTop: 15,
  },
  statusBubble: {
    backgroundColor: '#f1f2f5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusBubbleText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEmoji: {
    fontSize: 54,
  },
  plusStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#00b2ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  handleText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '400',
  },
});
