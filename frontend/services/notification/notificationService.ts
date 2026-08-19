import { getApiBaseUrl } from '../shared/apiConfig';
import { apiClient } from '../shared/apiClient';

export interface ActorInfo {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'RATING' | 'NEW_RECIPE';
  reference_type: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
  message: string;
  actor: ActorInfo | null;
}

export interface NotificationSettings {
  user_id: number;
  follow_enabled: boolean;
  like_enabled: boolean;
  comment_enabled: boolean;
  rating_enabled: boolean;
  new_recipe_enabled: boolean;
}

const API_BASE_URL = getApiBaseUrl();

export const notificationService = {
  fetchNotifications: async (limit: number = 50): Promise<NotificationItem[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/notifications?limit=${limit}`);
      if (response.status === 'success') {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  markAsRead: async (notificationId: number, isRead: boolean = true): Promise<boolean> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/notifications/${notificationId}/read?is_read=${isRead}`);
      return response.status === 'success';
    } catch (error) {
      console.error('Error marking notification read status:', error);
      return false;
    }
  },

  deleteNotification: async (notificationId: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`${API_BASE_URL}/notifications/${notificationId}`);
      return response.status === 'success';
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  },

  fetchSettings: async (): Promise<NotificationSettings | null> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/notifications/settings`);
      if (response.status === 'success') {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  },

  updateSettings: async (settings: Partial<Omit<NotificationSettings, 'user_id'>>): Promise<NotificationSettings | null> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/notifications/settings`, settings);
      if (response.status === 'success') {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return null;
    }
  }
};
