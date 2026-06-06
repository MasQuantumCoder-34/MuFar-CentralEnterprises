'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import type { IUser, IApiResponse } from '@/types';
import { UserRole } from '@/types';
import { usePagination } from '@/hooks/usePagination';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  role: z.nativeEnum(UserRole),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});

type UserForm = z.infer<typeof userSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { page, limit, total, totalPages, setPage, setLimit, setTotal } = usePagination();

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', page, limit, search],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      const res = await api.get<IApiResponse<IUser[]>>(`/users?${params}`);
      if (res.data.meta) setTotal(res.data.meta.total);
      return (res.data.data || []).filter((u) => u.role !== UserRole.CLIENT);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      await api.post('/auth/register', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserForm> }) => {
      await api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      setDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/users/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
  });

  const openCreate = () => {
    setEditingUser(null);
    form.reset({ role: UserRole.MANAGER, password: '' });
    setDialogOpen(true);
  };

  const openEdit = (user: IUser) => {
    setEditingUser(user);
    form.reset({
      name: user.name || '',
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      password: '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    form.reset();
  };

  const onSubmit = (data: UserForm) => {
    if (editingUser) {
      const { password, ...rest } = data;
      updateMutation.mutate({ id: editingUser._id, data: password ? data : rest });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'role',
      header: 'Role',
      render: (user: IUser) => (
        <Badge variant={user.role === UserRole.SUPER_ADMIN ? 'destructive' : 'default'}>
          {user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: IUser) => (
        <Badge variant={user.isActive ? 'success' : 'secondary'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage staff accounts</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />

      <DataTable
        columns={columns}
        data={users || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No users found"
        keyExtractor={(u: IUser) => u._id}
        actions={(user: IUser) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleMutation.mutate({ id: user._id, isActive: !user.isActive })}
            >
              {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setDeleteId(user._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input {...form.register('mobile')} />
              {form.formState.errors.mobile && (
                <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(v) => form.setValue('role', v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                  <SelectItem value={UserRole.SALES_EXECUTIVE}>Sales Executive</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Password {editingUser && '(leave blank to keep)'}</Label>
              <Input type="password" {...form.register('password')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete User"
        description="Are you sure you want to delete this user?"
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
