import * as SecureStore from 'expo-secure-store';
import api from './api';
import { AuthResponse, User } from '../types';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });

    const { token, refreshToken, user } = response.data;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async refreshToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await api.post<{ token: string; refreshToken?: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    const { token, refreshToken: newRefresh } = response.data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (newRefresh) {
      await SecureStore.setItemAsync(REFRESH_KEY, newRefresh);
    }

    return token;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
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
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async getStoredToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
};

export default authService;
