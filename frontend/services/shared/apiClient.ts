import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('userToken');

    const headers: any = {
      ...options.headers,
    };

    // Tự động set Content-Type là application/json khi body không phải là FormData/string và chưa có Content-Type
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || 'Lỗi kết nối Server');
    }

    return response.json();
  },

  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    const isString = typeof body === 'string';
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData || isString ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  put(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    const isString = typeof body === 'string';
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData || isString ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};
export default apiClient;
