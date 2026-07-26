import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ipAddress = hostUri.split(':')[0];
        return `http://${ipAddress}:5000/api/auth`;
    }
    return 'http://localhost:5000/api/auth';
};

const AUTH_URL = getBaseUrl();

// Hàm Đăng ký hoặc Đăng nhập chung
export const authenticateUser = async (username: string, password: string, isLogin: boolean) => {
    const endpoint = isLogin ? '/login' : '/register';
    const url = `${AUTH_URL}${endpoint}`;

    try {
        let bodyData;
        let headers: any = {};

        if (isLogin) {
            // API Login của FastAPI yêu cầu định dạng FormData (application/x-www-form-urlencoded)
            bodyData = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
            // API Register yêu cầu JSON
            bodyData = JSON.stringify({ username, password });
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: bodyData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Lỗi xác thực');
        }

        const data = await response.json();

        // Chỉ lưu Token vào ví nếu là Đăng nhập
        if (isLogin) {
            await AsyncStorage.setItem('userToken', data.access_token);
        }
        return true;

    } catch (error: any) {
        console.error(`❌ Lỗi ${isLogin ? 'Đăng nhập' : 'Đăng ký'}:`, error.message);
        throw error;
    }
};

// Hàm lấy Token ra dùng
export const getToken = async () => {
    return await AsyncStorage.getItem('userToken');
};

// Hàm Đăng xuất (Vứt thẻ đi)
export const logoutUser = async () => {
    await AsyncStorage.removeItem('userToken');
};

// HÀM LẤY THÔNG TIN CÁ NHÂN
export const getUserProfile = async () => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Chưa đăng nhập");

        const response = await fetch(`${AUTH_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Không thể tải thông tin");

        return await response.json();
    } catch (error) {
        console.error("❌ Lỗi tải Profile:", error);
        return null;
    }
};

// HÀM CẬP NHẬT THÔNG TIN CÁ NHÂN
export const updateUserProfile = async (fullName: String, avatar: String) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Chưa đăng nhập");

        const response = await fetch(`${AUTH_URL}/me/update`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                avatar: avatar
            })
        });

        if (!response.ok) throw new Error("Không thể cập nhật thông tin");

        return await response.json();
    } catch (error) {
        console.error("❌ Cập nhật Profile:", error);
        return false;
    }
}

// HÀM CẬP NHẬT ẢNH ĐẠI DIỆN BẰNG FILE
export const updateUserAvatar = async (imageUri: string) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Chưa đăng nhập");

        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        const response = await fetch(`${AUTH_URL}/me/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });

        if (!response.ok) throw new Error("Không thể tải ảnh lên");

        return await response.json();
    } catch (error) {
        console.error("❌ Lỗi tải ảnh lên:", error);
        throw error;
    }
};