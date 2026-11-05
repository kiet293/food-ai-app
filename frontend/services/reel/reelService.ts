import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

const REELS_API_URL = `${getApiBaseUrl()}/reels`;

export const fetchReelById = async (id: number) => {
    const response = await apiClient.get(`${REELS_API_URL}/${id}`);
    return response.data;
};

// 1. Hàm lấy danh sách Reels
export const fetchReels = async (page: number = 1, limit: number = 20, strict: boolean = false) => {
    try {
        const resData = await apiClient.get(`${REELS_API_URL}?page=${page}&limit=${limit}`);
        return resData.data || [];
    } catch (error) {
        if (strict) throw error;
        console.error("❌ Lỗi tải Reels từ API:", error);
        return [];
    }
};

// 2. Hàm thả tim / bỏ thả tim video
export const toggleLikeReel = async (dbId: number) => {
    try {
        const resData = await apiClient.post(`${REELS_API_URL}/${dbId}/like`);
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
    parentId?: string;
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
    } catch {
        return 'Vài giờ trước';
    }
};

// 3. Hàm lấy bình luận của Reel
export const fetchReelComments = async (dbId: number): Promise<Comment[]> => {
    try {
        const resData = await apiClient.get(`${REELS_API_URL}/${dbId}/comments`);
        const rawComments = resData.data || [];

        // Thực hiện mapping format ngay tại tầng Service
        return rawComments.map((c: any) => ({
            id: c.id.toString(),
            authorName: c.user.name || c.user.username,
            authorAvatar: c.user.avatar || '🥗',
            text: c.content,
            parentId: c.parent_comment_id ? c.parent_comment_id.toString() : undefined,
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
export const createReelComment = async (dbId: number, content: string, parentCommentId?: number): Promise<Comment> => {
    try {
        const body: any = { content };
        if (parentCommentId !== undefined) {
            body.parent_comment_id = parentCommentId;
        }
        const resData = await apiClient.post(`${REELS_API_URL}/${dbId}/comments`, body);
        const c = resData.data;

        // Trả về đối tượng Comment sạch cho UI Component tiêu thụ trực tiếp
        return {
            id: c.id.toString(),
            authorName: c.user.name || c.user.username,
            authorAvatar: c.user.avatar || '🥗',
            text: c.content,
            parentId: c.parent_comment_id ? c.parent_comment_id.toString() : undefined,
            timeAgo: c.created_at ? formatTimeAgo(c.created_at) : 'Vừa xong',
            likesCount: c.likesCount || 0,
            isLiked: c.isLiked || false,
        };
    } catch (error) {
        console.error("❌ Lỗi đăng bình luận Reel:", error);
        throw error;
    }
};

// 5. Hàm đăng video Reel lên Cloudinary qua Backend (dùng FormData)
export const uploadReel = async (videoUri: string, caption?: string, recipeId?: number) => {
    try {
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

        const resData = await apiClient.post(`${REELS_API_URL}/upload`, formData);
        return resData.data;
    } catch (error) {
        console.error("❌ Lỗi upload video Reel:", error);
        throw error;
    }
};

// 6. Hàm thích/bỏ thích bình luận
export const toggleCommentLike = async (commentId: number) => {
    try {
        const resData = await apiClient.post(`${REELS_API_URL}/comments/${commentId}/like`);
        return resData.data; // Trả về { isLiked: boolean }
    } catch (error) {
        console.error("❌ Lỗi toggleCommentLike:", error);
        throw error;
    }
};

// 7. Hàm tăng lượt xem video
export const incrementReelView = async (dbId: number) => {
    try {
        const resData = await apiClient.post(`${REELS_API_URL}/${dbId}/view`);
        return resData.data; // Trả về { viewsCount: number }
    } catch (error) {
        console.error("❌ Lỗi tăng lượt xem video:", error);
        throw error;
    }
};
