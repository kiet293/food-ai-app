import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/services/authService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (!token) {
          router.replace('/login');
        }
      } catch (error) {
        console.error("Lỗi kiểm tra token:", error);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tìm Kiếm',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="popular"
        options={{
          title: 'Xu hướng',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="flame.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notebook"
        options={{
          title: 'Sổ tay', // 1. Đổi tên hiển thị trên thanh Tab ở dưới cùng
          headerTitle: 'Sổ tay ẩm thực', // (Tùy chọn) Đổi chữ hiển thị trên thanh Header ở trên cùng nếu có
          tabBarIcon: ({ color }) => (
            // 2. Đổi icon thành hình cuốn sổ hoặc trái tim cho đúng ý nghĩa
            <IconSymbol size={28} name="book.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
