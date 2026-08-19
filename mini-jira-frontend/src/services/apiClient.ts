import axios from 'axios';
import { ApiResponse, AuthResponse } from '../types';

export function getFriendlyError(err: any): string {
  const status = err?.response?.status;
  const backendMsg = err?.response?.data?.error?.message || err?.response?.data?.message;
  if (backendMsg && !backendMsg.toLowerCase().includes('exception') && !backendMsg.toLowerCase().includes('stack')) {
    return backendMsg;
  }

  switch (status) {
    case 400: return 'Please check your input and try again.';
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'A conflict occurred. This record may already exist.';
    case 422: return 'Please enter all required fields correctly.';
    case 429: return 'Too many requests. Please wait a moment and try again.';
    case 500: return 'Something went wrong on our end. Please try again.';
    case 502:
    case 503:
    case 504: return 'The server is temporarily unavailable. Please try again shortly.';
    default: return 'Something went wrong. Please try again.';
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void, reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Direct call to refresh endpoint; browser automatically sends HttpOnly jwt_refresh_token cookie
        const res = await axios.post<ApiResponse<AuthResponse>>(
          '/auth/refresh',
          {},
          {
            baseURL: import.meta.env.VITE_API_URL || '/api/v1',
            withCredentials: true
          }
        );

        if (res.data.success && res.data.data) {
          processQueue(null, res.data.data.accessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    // Attach friendly message to error so callers can use err.friendlyMessage
    error.friendlyMessage = getFriendlyError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
