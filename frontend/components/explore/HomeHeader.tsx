import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HomeHeaderProps {
  userAvatar: string;
  fullName: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userAvatar, fullName }) => {
  const router = useRouter();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Chào buổi sáng ☀️';
    if (hr < 18) return 'Chào buổi chiều 🌤️';
    return 'Chào buổi tối 🌙';
  };

  const isAvatarUrl = userAvatar.startsWith('http://') || userAvatar.startsWith('https://');

  return (
    <View style={styles.userHeaderRow}>
      <Pressable
        style={styles.avatarBtn}
        onPress={() => router.push('/(tabs)/profile')}
        hitSlop={8}
      >
        {isAvatarUrl ? (
          <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{userAvatar}</Text>
        )}
      </Pressable>

      <View style={styles.welcomeTextWrap}>
        <Text style={styles.welcomeSub}>{getGreeting()}</Text>
        <Text style={styles.welcomeTitle} numberOfLines={1}>
          {fullName || 'Đầu Bếp Tại Gia'}
        </Text>
      </View>

      <TouchableOpacity style={styles.notificationWrap}>
        <Ionicons name="notifications-outline" size={22} color="#333" />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 20,
  },
  welcomeTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeSub: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginTop: 2,
  },
  notificationWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f6f8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
});
