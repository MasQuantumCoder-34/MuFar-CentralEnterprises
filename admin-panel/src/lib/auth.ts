import { jwtDecode } from 'jwt-decode';
import type { IJwtPayload } from '@/types';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

export function removeToken(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode<IJwtPayload & { exp?: number }>(token);
    return (decoded.exp ?? 0) * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUserFromToken(): IJwtPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode<IJwtPayload>(token);
  } catch {
    return null;
  }
}
