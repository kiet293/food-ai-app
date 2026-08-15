import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

const AUTH_URL = `${getApiBaseUrl()}/auth`;

// Hàm Đăng ký hoặc Đăng nhập chung
export const authenticateUser = async (username: string, password: string, isLogin: boolean) => {
    const endpoint = isLogin ? '/login' : '/register';
    const url = `${AUTH_URL}${endpoint}`;

    try {
        let bodyData;
        let headers: any = {};

        if (isLogin) {
            bodyData = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
            bodyData = { username, password };
        }

        const data = await apiClient.post(url, bodyData, { headers });

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
        return await apiClient.get(`${AUTH_URL}/me`);
    } catch (error) {
        console.error("❌ Lỗi tải Profile:", error);
        return null;
    }
};

// HÀM CẬP NHẬT THÔNG TIN CÁ NHÂN (Tên, Avatar, Bio)
export const updateUserProfile = async (fullName?: string, avatar?: string, bio?: string) => {
    try {
        const bodyData: any = {};
        if (fullName !== undefined) bodyData.full_name = fullName;
        if (avatar !== undefined) bodyData.avatar = avatar;
        if (bio !== undefined) bodyData.bio = bio;

        return await apiClient.put(`${AUTH_URL}/me/update`, bodyData);
    } catch (error) {
        console.error("❌ Cập nhật Profile:", error);
        return false;
    }
};

// HÀM CẬP NHẬT ẢNH ĐẠI DIỆN BẰNG FILE
export const updateUserAvatar = async (imageUri: string) => {
    try {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        return await apiClient.post(`${AUTH_URL}/me/avatar`, formData);
    } catch (error) {
        console.error("❌ Lỗi tải ảnh lên:", error);
        throw error;
    }
};
