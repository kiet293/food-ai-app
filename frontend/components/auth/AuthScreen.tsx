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
    Platform
} from 'react-native';
import { authenticateUser } from '../../services/auth/authService';

// Truyền prop onLoginSuccess để báo cho App biết là đã đăng nhập thành công
export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [isLoginMode, setIsLoginMode] = useState(true); // Mặc định mở lên là màn hình Đăng nhập
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
            return;
        }

        setIsLoading(true);
        try {
            await authenticateUser(username, password, isLoginMode);
            if (isLoginMode) {
                Alert.alert("Thành công! 🎉", "Chào mừng bạn trở lại!");
                // Đăng nhập thành công -> Đổi màn hình chính của App
                onLoginSuccess();
            } else {
                Alert.alert("Thành công! 🎉", "Tạo tài khoản thành công! Vui lòng đăng nhập để tiếp tục.");
                // Đăng ký thành công -> Chuyển form về trạng thái Đăng nhập, đồng thời xóa trống mật khẩu
                setPassword('');
                setIsLoginMode(true);
            }

        } catch (error: any) {
            Alert.alert("Thất bại", error.message || "Tên đăng nhập hoặc mật khẩu không đúng.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.card}>
                <Text style={styles.title}>
                    {isLoginMode ? 'Đăng Nhập 🍳' : 'Tạo Tài Khoản 👨‍🍳'}
                </Text>
                <Text style={styles.subtitle}>
                    {isLoginMode ? 'Vào bếp và khám phá công thức AI!' : 'Trở thành siêu đầu bếp cùng AI!'}
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Tên đăng nhập"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.mainButtonText}>
                            {isLoginMode ? 'Đăng Nhập' : 'Đăng Ký'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setIsLoginMode(!isLoginMode)}
                >
                    <Text style={styles.switchButtonText}>
                        {isLoginMode
                            ? 'Chưa có tài khoản? Đăng ký tại đây'
                            : 'Đã có tài khoản? Quay lại Đăng nhập'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 440,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        borderWidth: Platform.OS === 'web' ? 1 : 0,
        borderColor: '#e2e8f0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#28a745',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 28,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 16,
    },
    mainButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: 22,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#28a745',
        fontSize: 14,
        fontWeight: '600',
    }
});