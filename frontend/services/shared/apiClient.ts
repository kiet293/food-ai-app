import AsyncStorage from '@react-native-async-storage/async-storage';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 30000;
export type ApiRequestOptions = RequestInit & { timeoutMs?: number };

async function request(endpoint: string, options: ApiRequestOptions = {}) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const token = await AsyncStorage.getItem('userToken');
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(endpoint, { ...fetchOptions, headers, signal: controller.signal });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      throw new ApiError(response.ok ? 'Server trả về dữ liệu không hợp lệ' : `Lỗi máy chủ (${response.status})`, response.status);
    }
    if (!response.ok) {
      let message = data?.message;
      if (!message) {
        if (typeof data?.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
          message = data.detail
            .map((item: any) => (typeof item === 'string' ? item : item?.msg || item?.message || JSON.stringify(item)))
            .join('; ');
        } else if (Array.isArray(data?.data) && data.data.length > 0) {
          message = data.data
            .map((item: any) => (typeof item === 'string' ? item : item?.msg || item?.message || JSON.stringify(item)))
            .join('; ');
        }
      }
      if (!message) {
        if (response.status === 422) {
          message = 'Dữ liệu không hợp lệ';
        } else if (response.status === 404) {
          message = 'Không tìm thấy dữ liệu';
        } else if (response.status === 401) {
          message = 'Chưa xác thực';
        } else if (response.status === 403) {
          message = 'Không có quyền truy cập';
        } else if (response.status >= 500) {
          message = `Lỗi máy chủ (${response.status})`;
        } else {
          message = 'Lỗi kết nối Server';
        }
      }
      throw new ApiError(message, response.status, data?.code);
    }
    return data;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

function write(endpoint: string, method: string, body?: unknown, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers);
  const nativeBody = body instanceof FormData || typeof body === 'string';
  if (body !== undefined && !nativeBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return request(endpoint, {
    ...options, method, headers,
    body: body === undefined ? undefined : nativeBody ? body as BodyInit : JSON.stringify(body),
  });
}

export const apiClient = {
  request,
  get: (endpoint: string, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: unknown, options?: ApiRequestOptions) => write(endpoint, 'POST', body, options),
  put: (endpoint: string, body?: unknown, options?: ApiRequestOptions) => write(endpoint, 'PUT', body, options),
  delete: (endpoint: string, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
