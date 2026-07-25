import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ipAddress = hostUri.split(':')[0];
        return `http://${ipAddress}:5000/api/reels`;
    }
    return 'http://localhost:5000/api/reels';
};

const REELS_API_URL = getBaseUrl();

const getToken = async () => {
    return await AsyncStorage.getItem('userToken');
};

// 1. Hàm lấy danh sách Reels
export const fetchReels = async () => {
    try {
        const token = await getToken();
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(REELS_API_URL, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error("Không thể tải danh sách Reels");
        }

        const resData = await response.json();
        return resData.data; // Trả về mảng danh sách các Reels
    } catch (error) {
        console.error("❌ Lỗi tải Reels từ API:", error);
        return [];
    }
};

// 2. Hàm thả tim / bỏ thả tim video
export const toggleLikeReel = async (dbId: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện");

        const response = await fetch(`${REELS_API_URL}/${dbId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Lỗi khi gửi yêu cầu thả tim");
        }

        const resData = await response.json();
        return resData.data; // Trả về { isLiked: boolean }
    } catch (error) {
        console.error("❌ Lỗi toggleLikeReel:", error);
        throw error;
    }
};

// 3. Hàm lấy bình luận của Reel
export const fetchReelComments = async (dbId: number) => {
    try {
        const response = await fetch(`${REELS_API_URL}/${dbId}/comments`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error("Không thể tải bình luận");
        }

        const resData = await response.json();
        return resData.data; // Trả về danh sách bình luận
    } catch (error) {
        console.error("❌ Lỗi lấy bình luận Reel:", error);
        return [];
    }
};

// 4. Hàm đăng bình luận mới
export const createReelComment = async (dbId: number, content: string) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để bình luận");

        const response = await fetch(`${REELS_API_URL}/${dbId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error("Lỗi khi đăng bình luận");
        }

        const resData = await response.json();
        return resData.data; // Trả về thông tin bình luận mới vừa tạo
    } catch (error) {
        console.error("❌ Lỗi đăng bình luận Reel:", error);
        throw error;
    }
};

// 5. Hàm đăng video Reel lên Cloudinary qua Backend
export const uploadReel = async (videoUri: string, caption?: string, recipeId?: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để đăng Reels");

        const formData = new FormData();

        // Làm sạch URI khỏi query parameters hoặc hash fragment (VD: ?foo=bar)
        const cleanUri = videoUri.split('?')[0].split('#')[0];
        const uriParts = cleanUri.split('/');
        const fileName = uriParts[uriParts.length - 1] || 'video.mp4';

        let fileExtension = fileName.split('.').pop()?.toLowerCase() || 'mp4';
        const supportedExtensions = ['mp4', 'mov', 'avi', 'mkv', '3gp'];
        if (!supportedExtensions.includes(fileExtension)) {
            fileExtension = 'mp4';
        }

        formData.append('video', {
            uri: videoUri,
            name: `reel_video.${fileExtension}`,
            type: `video/${fileExtension === 'mov' ? 'quicktime' : fileExtension}`
        } as any);

        if (caption) {
            formData.append('caption', caption);
        }
        if (recipeId) {
            formData.append('recipe_id', recipeId.toString());
        }

        const response = await fetch(`${REELS_API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorMsg = await response.json();
            throw new Error(errorMsg.message || errorMsg.detail || "Không thể đăng video");
        }

        const resData = await response.json();
        return resData.data;
    } catch (error) {
        console.error("❌ Lỗi upload video Reel:", error);
        throw error;
    }
};
