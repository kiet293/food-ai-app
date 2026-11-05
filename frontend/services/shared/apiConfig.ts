import Constants from 'expo-constants';

// Tự động bắt IP máy tính đang chạy Expo để build địa chỉ API backend.
// Dùng chung cho mọi service thay vì mỗi file tự viết lại logic này.
export const getApiBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  const hostUri = Constants.expoConfig?.hostUri;
  const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${ipAddress}:5000/api`;
};

export const getWsBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_WS_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.EXPO_PUBLIC_API_URL) {
    return getApiBaseUrl().replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws';
  }
  const hostUri = Constants.expoConfig?.hostUri;
  const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `ws://${ipAddress}:5000/ws`;
};
