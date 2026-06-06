'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import { setToken, removeToken, getToken } from '@/lib/auth';
import type { IUser, ILoginResponse, IJwtPayload } from '@/types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: IUser | null;
  tokenPayload: IJwtPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: IUser | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  tokenPayload: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenPayload = (() => {
    if (!user) return null;
    try {
      const token = getToken();
      if (!token) return null;
      return jwtDecode<IJwtPayload>(token);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = getToken();
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored) as IUser;
        setUserState(parsed);
      } catch {
        removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = useCallback((u: IUser | null) => {
    setUserState(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post('/auth/login', {
        email,
        password,
      });
      const { accessToken, refreshToken, user: userData } = (res.data as any).data as ILoginResponse;
      setToken(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUserState(userData);
    },
    []
  );

  const logout = useCallback(() => {
    removeToken();
    localStorage.removeItem('user');
    setUserState(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokenPayload,
        isLoading,
        isAuthenticated: !!user && !!getToken(),
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
