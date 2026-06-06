import { storage } from './storage';
import api from './api';
import { AuthResponse, User } from '../types';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user_data';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });

    const { accessToken, refreshToken, user } = response.data.data;

    await storage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await storage.setItem(REFRESH_KEY, refreshToken);
    }
    await storage.setItem(USER_KEY, JSON.stringify(user));

    return { accessToken, refreshToken, user };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(REFRESH_KEY);
    await storage.removeItem(USER_KEY);
  },

  async refreshToken(): Promise<string> {
    const refreshToken = await storage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
      '/auth/refresh',
      { refreshToken }
    );

    const { accessToken, refreshToken: newRefresh } = response.data.data;
    await storage.setItem(TOKEN_KEY, accessToken);
    if (newRefresh) {
      await storage.setItem(REFRESH_KEY, newRefresh);
    }

    return accessToken;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const data = await storage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await storage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
};

export default authService;
