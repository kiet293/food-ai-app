import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AuthScreen from '../components/AuthScreen';

import { useAuth } from './_layout';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  return (
    <View style={styles.container}>
      <AuthScreen onLoginSuccess={() => {
        signIn(); // Cập nhật trạng thái đã đăng nhập vào Context
        router.replace('/(tabs)');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  }
});
