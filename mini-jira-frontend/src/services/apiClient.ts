import axios from 'axios';
import { ApiResponse, AuthResponse } from '../types';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Automatically includes HttpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        // Direct call to refresh endpoint; browser automatically sends HttpOnly jwt_refresh_token cookie
        const res = await axios.post<ApiResponse<AuthResponse>>(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        if (res.data.success) {
          // Token refreshed successfully via HttpOnly cookies
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
