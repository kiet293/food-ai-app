import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '../../services/shared/apiConfig';
import { notificationService } from '../../services/notification/notificationService';

interface HomeHeaderProps {
  userAvatar: string;
  fullName: string;
  userId?: number;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userAvatar, fullName, userId }) => {
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState<boolean>(false);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Chào buổi sáng ☀️';
    if (hr < 18) return 'Chào buổi chiều 🌤️';
    return 'Chào buổi tối 🌙';
  };

  const getWsUrl = () => {
    const baseUrl = getApiBaseUrl(); // E.g., "http://192.168.1.242:5000/api"
    const wsProto = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const domain = baseUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
    return `${wsProto}://${domain}`;
  };

  useEffect(() => {
    if (!userId) return;

    // 1. Kiểm tra trạng thái thông báo chưa đọc ban đầu
    const checkInitialNotifications = async () => {
      const list = await notificationService.fetchNotifications(20);
      const unreadCount = list.filter((n) => !n.is_read).length;
      setHasUnread(unreadCount > 0);
    };
    checkInitialNotifications();

    // 2. Kết nối WebSocket nhận thông báo thời gian thực
    const wsUrl = `${getWsUrl()}/ws/notifications/${userId}`;
    console.log(`[WebSocket] Kết nối thông báo: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_NOTIFICATION') {
          setHasUnread(true);
          // Hiển thị thông báo nổi thân thiện
          Alert.alert(
            "Thông báo mới 🔔",
            payload.data.message,
            [
              {
                text: "Xem ngay",
                onPress: () => {
                  setHasUnread(false);
                  router.push('/notification');
                }
              },
              { text: "Đóng", style: "cancel" }
            ]
          );
        }
      } catch (error) {
        console.error('Lỗi phân tích WebSocket notification message:', error);
      }
    };

    ws.onerror = (e) => {
      console.log('[WebSocket] Lỗi kết nối thông báo:', e);
    };

    ws.onclose = () => {
      console.log('[WebSocket] Đóng kết nối thông báo.');
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  const handleNotificationPress = () => {
    setHasUnread(false);
    router.push('/notification');
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

      <TouchableOpacity style={styles.notificationWrap} onPress={handleNotificationPress}>
        <Ionicons name="notifications-outline" size={22} color="#333" />
        {hasUnread && <View style={styles.unreadBadge} />}
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
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4757', // Coral Red
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
