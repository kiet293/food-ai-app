import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
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
    </Tabs>
  );
}
