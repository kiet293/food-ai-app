import Constants from 'expo-constants';

// Tự động bắt IP máy tính đang chạy Expo để build địa chỉ API backend.
// Dùng chung cho mọi service thay vì mỗi file tự viết lại logic này.
export const getApiBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  const ipAddress = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${ipAddress}:5000/api`;
};
