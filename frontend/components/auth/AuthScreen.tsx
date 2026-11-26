import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticateUser } from '../../services/auth/authService';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=85';

export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (loginMode: boolean) => {
    setIsLoginMode(loginMode);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận chưa trùng khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setIsLoading(true);
    try {
      await authenticateUser(username.trim(), password, isLoginMode);
      if (isLoginMode) {
        onLoginSuccess();
      } else {
        Alert.alert(
          'Đăng ký thành công! 🎉',
          'Tài khoản của bạn đã sẵn sàng. Vui lòng đăng nhập để bắt đầu khám phá!'
        );
        switchMode(true);
      }
    } catch (error: any) {
      Alert.alert('Thao tác thất bại', error.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* 1. HERO HEADER */}
        <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroBanner} resizeMode="cover">
          <LinearGradient
            colors={['rgba(10, 35, 18, 0.35)', 'rgba(10, 35, 18, 0.85)']}
            style={styles.heroGradient}
          >
            <View style={styles.brandChip}>
              <Ionicons name="sparkles" size={13} color="#4ade80" />
              <Text style={styles.brandChipText}>TRỢ LÝ ẨM THỰC THÔNG MINH</Text>
            </View>

            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Ionicons name="restaurant" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.brandTitle}>FoodAI</Text>
                <Text style={styles.brandTagline}>Nấu ngon hơn mỗi ngày cùng AI</Text>
              </View>
            </View>

            <View style={styles.featurePillsRow}>
              <View style={styles.featurePill}>
                <Ionicons name="camera-outline" size={13} color="#bbf7d0" />
                <Text style={styles.featurePillText}>Quét nguyên liệu</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons name="flame-outline" size={13} color="#bbf7d0" />
                <Text style={styles.featurePillText}>Gợi ý món chuẩn</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons name="people-outline" size={13} color="#bbf7d0" />
                <Text style={styles.featurePillText}>Cộng đồng bếp</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* 2. AUTH SHEET CARD */}
        <View style={styles.sheetContainer}>
          <View style={styles.card}>
            {/* SEGMENTED MODE SWITCHER */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabBtn, isLoginMode && styles.tabBtnActive]}
                onPress={() => switchMode(true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabBtnText, isLoginMode && styles.tabBtnTextActive]}>
                  Đăng nhập
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, !isLoginMode && styles.tabBtnActive]}
                onPress={() => switchMode(false)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabBtnText, !isLoginMode && styles.tabBtnTextActive]}>
                  Đăng ký
                </Text>
              </TouchableOpacity>
            </View>

            {/* WELCOME HEADER */}
            <View style={styles.welcomeBlock}>
              <Text style={styles.welcomeTitle}>
                {isLoginMode ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
              </Text>
              <Text style={styles.welcomeSub}>
                {isLoginMode
                  ? 'Đăng nhập để tiếp tục lưu công thức và khám phá món ngon.'
                  : 'Tham gia cộng đồng yêu bếp và nhận gợi ý công thức từ AI.'}
              </Text>
            </View>

            {/* USERNAME INPUT */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Tên đăng nhập</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'username' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={focusedField === 'username' ? '#28a745' : '#94a3b8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên đăng nhập của bạn"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
                {username.length > 0 && (
                  <TouchableOpacity onPress={() => setUsername('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={17} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* PASSWORD INPUT */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={focusedField === 'password' ? '#28a745' : '#94a3b8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={isLoginMode ? 'Nhập mật khẩu' : 'Tạo mật khẩu bảo mật'}
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRM PASSWORD INPUT (ONLY IN REGISTER MODE) */}
            {!isLoginMode && (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                    confirmPassword.length > 0 &&
                    password !== confirmPassword &&
                    styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={19}
                    color={
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? '#ef4444'
                        : focusedField === 'confirmPassword'
                          ? '#28a745'
                          : '#94a3b8'
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.errorHintText}>Mật khẩu xác nhận chưa khớp</Text>
                )}
              </View>
            )}

            {/* PRIMARY SUBMIT BUTTON */}
            <TouchableOpacity
              style={[styles.submitBtnWrap, isLoading && { opacity: 0.75 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#28a745', '#1e7e34']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      {isLoginMode ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* SWITCH PROMPT FOOTER */}
            <View style={styles.footerSwitchRow}>
              <Text style={styles.footerPromptText}>
                {isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              </Text>
              <TouchableOpacity onPress={() => switchMode(!isLoginMode)} hitSlop={8}>
                <Text style={styles.footerLinkText}>
                  {isLoginMode ? ' Đăng ký miễn phí' : ' Đăng nhập ngay'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroBanner: {
    width: '100%',
    height: 270,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 42,
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
    gap: 6,
  },
  brandChipText: {
    color: '#ecfdf5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 13,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  brandTagline: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  featurePillText: {
    color: '#e2f8e9',
    fontSize: 11,
    fontWeight: '600',
  },
  sheetContainer: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 24,
    flex: 1,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F3',
    borderRadius: 16,
    padding: 4,
    marginBottom: 22,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#1A3A1A',
    fontWeight: '800',
  },
  welcomeBlock: {
    marginBottom: 22,
  },
  welcomeTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1A3A1A',
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 13.5,
    color: '#64748b',
    lineHeight: 19,
    marginTop: 5,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#28a745',
    backgroundColor: '#F4FBF6',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  errorHintText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 4,
  },
  submitBtnWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  submitBtnGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerPromptText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLinkText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '800',
  },
});
