import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, createContext, useContext } from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserProfile, logoutUser } from '../services/auth/authService';

export const unstable_settings = {
  anchor: '(tabs)',
};

// --- AUTH CONTEXT ---
const AuthContext = createContext({
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);
// --------------------

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          await logoutUser();
        }
      } catch (error) {
        setIsAuthenticated(false);
        await logoutUser();
      } finally {
        setIsReady(true);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isReady, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{
        isAuthenticated,
        signIn: () => setIsAuthenticated(true),
        signOut: () => setIsAuthenticated(false),
      }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={styles.webWrapper}>
            <View style={styles.webContainer}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="search" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </View>
          </View>
        </ThemeProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

const IS_WEB = Platform.OS === 'web';

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    // Nền gradient xanh lá nhạt cho web — hài hòa với màu chủ đạo của app
    backgroundColor: IS_WEB ? '#e8f5e9' : '#fff',
    alignItems: IS_WEB ? 'center' : 'stretch',
    justifyContent: IS_WEB ? 'center' : 'flex-start',
  },
  webContainer: {
    flex: 1,
    // Trên web: giới hạn chiều rộng tối đa 430px (chuẩn iPhone 15 Pro Max)
    // và thêm bo góc + đổ bóng tạo hiệu ứng khung điện thoại thực
    width: IS_WEB ? 430 : '100%',
    maxWidth: IS_WEB ? 430 : undefined,
    maxHeight: IS_WEB ? '95vh' : undefined,
    borderRadius: IS_WEB ? 40 : 0,
    overflow: IS_WEB ? 'hidden' : 'visible',
    backgroundColor: '#fff',
    shadowColor: '#1a2e1a',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: IS_WEB ? 0.18 : 0,
    shadowRadius: IS_WEB ? 40 : 0,
  },
});
