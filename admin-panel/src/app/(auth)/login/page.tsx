'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Store, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { IUser, ILoginResponse } from '@/types';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_USERS: Record<string, { password: string; user: IUser }> = {
  'admin@mufar.com': {
    password: 'Admin@123',
    user: {
      _id: 'demo-admin-001',
      storeName: 'Mufar Technologies',
      ownerName: 'Super Admin',
      name: 'Super Admin',
      email: 'admin@mufar.com',
      mobile: '9999999999',
      role: 'super_admin',
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
      loginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as IUser,
  },
  'manager@mufar.com': {
    password: 'Manager@123',
    user: {
      _id: 'demo-manager-001',
      storeName: 'Mufar Technologies',
      ownerName: 'Store Manager',
      name: 'Store Manager',
      email: 'manager@mufar.com',
      mobile: '9999999998',
      role: 'manager',
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
      loginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as IUser,
  },
  'client@mufar.com': {
    password: 'Client@123',
    user: {
      _id: 'demo-client-001',
      storeName: 'Demo Store',
      ownerName: 'John Client',
      name: 'John Client',
      email: 'client@mufar.com',
      mobile: '9999999997',
      role: 'client',
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
      loginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as IUser,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', { email: data.email, password: data.password });
      const { accessToken, refreshToken, user: userData } = (res.data as any).data as ILoginResponse;
      setToken(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('demo_mode');
      setUser(userData);
      if (userData.mustChangePassword) {
        router.push('/reset-password');
        return;
      }
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (err: any) {
      if (!err?.response) {
        const demo = DEMO_USERS[data.email.toLowerCase()];
        if (demo && demo.password === data.password) {
          const demoToken = 'demo-jwt-token-' + Date.now();
          setToken(demoToken);
          localStorage.setItem('refreshToken', demoToken);
          localStorage.setItem('user', JSON.stringify(demo.user));
          localStorage.setItem('demo_mode', 'true');
          setUser(demo.user);
          toast.success('Offline mode — using demo account');
          router.push('/dashboard');
          return;
        }
      }
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Mufar Commerce</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@mufar.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-6 rounded-md bg-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Demo Credentials (Offline Mode)</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Admin:</span> admin@mufar.com / Admin@123</p>
              <p><span className="font-medium text-foreground">Manager:</span> manager@mufar.com / Manager@123</p>
              <p><span className="font-medium text-foreground">Client:</span> client@mufar.com / Client@123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
