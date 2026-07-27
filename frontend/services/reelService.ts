import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ipAddress = hostUri.split(':')[0];
        return `http://${ipAddress}:5000/api`;
    }
    return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();
const REELS_API_URL = `${API_BASE_URL}/reels`;

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
        return resData.data || [];
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

// Định nghĩa kiểu dữ liệu Comment chuẩn giao diện ứng dụng
export interface Comment {
    id: string;
    authorName: string;
    authorAvatar: string;
    text: string;
    timeAgo: string;
    likesCount: number;
    isLiked: boolean;
}

// Hàm format thời gian tương đối
const formatTimeAgo = (isoString: string): string => {
    try {
        const commentDate = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - commentDate.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHr < 24) return `${diffHr} giờ trước`;
        return `${diffDay} ngày trước`;
    } catch (e) {
        return 'Vài giờ trước';
    }
};

// 3. Hàm lấy bình luận của Reel
export const fetchReelComments = async (dbId: number): Promise<Comment[]> => {
    try {
        const response = await fetch(`${REELS_API_URL}/${dbId}/comments`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error("Không thể tải bình luận");
        }

        const resData = await response.json();
        const rawComments = resData.data || [];

        // Thực hiện mapping format ngay tại tầng Service
        return rawComments.map((c: any) => ({
            id: c.id.toString(),
            authorName: c.user.name || c.user.username,
            authorAvatar: c.user.avatar || '🥗',
            text: c.content,
            timeAgo: c.created_at ? formatTimeAgo(c.created_at) : 'Vừa xong',
            likesCount: c.likesCount || 0,
            isLiked: c.isLiked || false,
        }));
    } catch (error) {
        console.error("❌ Lỗi lấy bình luận Reel:", error);
        return [];
    }
};

// 4. Hàm đăng bình luận mới (đã được xử lý/format dữ liệu sạch)
export const createReelComment = async (dbId: number, content: string): Promise<Comment> => {
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
        const c = resData.data;

        // Trả về đối tượng Comment sạch cho UI Component tiêu thụ trực tiếp
        return {
            id: c.id.toString(),
            authorName: c.user.name || c.user.username,
            authorAvatar: c.user.avatar || '🥗',
            text: c.content,
            timeAgo: c.created_at ? formatTimeAgo(c.created_at) : 'Vừa xong',
            likesCount: c.likesCount || 0,
            isLiked: c.isLiked || false,
        };
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

// 6. Hàm thích/bỏ thích bình luận
export const toggleCommentLike = async (commentId: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện");

        const response = await fetch(`${REELS_API_URL}/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Lỗi khi gửi tương tác thích bình luận");
        }

        const resData = await response.json();
        return resData.data; // Trả về { isLiked: boolean }
    } catch (error) {
        console.error("❌ Lỗi toggleCommentLike:", error);
        throw error;
    }
};

// 7. Hàm theo dõi người dùng
export const followUser = async (userId: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện");

        const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Lỗi khi theo dõi người dùng");
        }

        const resData = await response.json();
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi followUser:", error);
        throw error;
    }
};

// 8. Hàm hủy theo dõi người dùng
export const unfollowUser = async (userId: number) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện");

        const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Lỗi khi hủy theo dõi người dùng");
        }

        const resData = await response.json();
        return resData.data; // Trả về { isFollowing: boolean }
    } catch (error) {
        console.error("❌ Lỗi unfollowUser:", error);
        throw error;
    }
};

