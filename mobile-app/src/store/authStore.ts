import { create } from 'zustand';
import { User } from '../types';
import authService from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | undefined>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateToken: (token: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await authService.getStoredToken();
      const user = await authService.getStoredUser();
      if (token && user) {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        try {
          const profile = await authService.getProfile();
          set({ user: profile });
        } catch {
          set({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    set({
      user: response.user,
      token: response.accessToken,
      isAuthenticated: true,
    });
    return response.user;
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  updateToken: async (token: string) => {
    set({ token });
  },
}));
