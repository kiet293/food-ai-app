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
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#28a745',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
    },
    mainButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#007bff',
        fontSize: 14,
    }
});