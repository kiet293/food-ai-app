import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, NotificationItem } from '../services/notification/notificationService';

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await notificationService.fetchNotifications(50);
    setNotifications(data);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await notificationService.fetchNotifications(50);
    setNotifications(data);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.is_read) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }

    if (item.type === 'FOLLOW' && item.actor) {
      router.push({ pathname: '/user/[id]', params: { id: item.actor.id } });
    } else if ((item.type === 'LIKE' || item.type === 'COMMENT' || item.type === 'RATING') && item.reference_id) {
      router.push({ pathname: '/explore-detail/[id]', params: { id: item.reference_id } });
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    await Promise.all(unread.map((n) => notificationService.markAsRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch {
      return '';
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return <Ionicons name="person-add" size={12} color="#fff" />;
      case 'LIKE':
        return <Ionicons name="heart" size={12} color="#fff" />;
      case 'COMMENT':
        return <Ionicons name="chatbubble" size={12} color="#fff" />;
      case 'RATING':
        return <Ionicons name="star" size={12} color="#fff" />;
      default:
        return <Ionicons name="notifications" size={12} color="#fff" />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return '#3B82F6'; // Blue
      case 'LIKE':
        return '#EF4444'; // Red
      case 'COMMENT':
        return '#10B981'; // Green (FoodAI Accent)
      case 'RATING':
        return '#F59E0B'; // Amber
      default:
        return '#8B5CF6'; // Purple
    }
  };

  // Grouping notifications for SectionList
  const getGroupedSections = () => {
    const today: NotificationItem[] = [];
    const older: NotificationItem[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    notifications.forEach((n) => {
      const date = new Date(n.created_at);
      if (date >= now) {
        today.push(n);
      } else {
        older.push(n);
      }
    });

    const sections = [];
    if (today.length > 0) {
      sections.push({ title: 'Hôm nay', data: today });
    }
    if (older.length > 0) {
      sections.push({ title: 'Trước đó', data: older });
    }
    return sections;
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const avatarUrl = item.actor?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80';
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard, 
          !item.is_read && styles.unreadCard
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={[styles.badgeIcon, { backgroundColor: getIconBgColor(item.type) }]}>
            {renderNotificationIcon(item.type)}
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.messageText} numberOfLines={3}>
            <Text style={styles.actorName}>{item.actor?.name || 'Ai đó'} </Text>
            {item.message.replace(item.actor?.name || 'Một người dùng', '').trim()}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Ẩn Header mặc định của Expo Router Stack */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity 
          onPress={handleMarkAllRead} 
          style={styles.markReadButton}
          disabled={!hasUnread}
        >
          <Text style={[styles.markReadText, !hasUnread && styles.disabledMarkReadText]}>Đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="notifications-off-outline" size={54} color="#a0aec0" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
          <Text style={styles.emptySubtitle}>
            Khi có ai đó thả tim, bình luận công thức hoặc follow bạn, thông báo sẽ xuất hiện ở đây!
          </Text>
        </View>
      ) : (
        <SectionList
          sections={getGroupedSections()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  markReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markReadText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  disabledMarkReadText: {
    color: '#cbd5e1',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#f0fbf7', // Light green tint
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    paddingLeft: 16, // Adjust padding due to borderLeft
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e2e8f0',
  },
  badgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '400',
  },
  actorName: {
    fontWeight: '700',
    color: '#0f172a',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 12,
  },
});
