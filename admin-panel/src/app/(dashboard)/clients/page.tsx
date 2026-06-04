'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { apiFallback, DEMO_CLIENTS } from '@/lib/demoData';
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
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { IUser, IApiResponse } from '@/types';
import { UserRole } from '@/types';
import { usePagination } from '@/hooks/usePagination';

const clientSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  alternateMobile: z.string().optional(),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { page, limit, total, totalPages, setPage, setLimit, setTotal } = usePagination();

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', page, limit, search],
    queryFn: () => apiFallback(
      async () => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('role', UserRole.CLIENT);
        if (search) params.set('search', search);
        const res = await api.get<IApiResponse<IUser[]>>(`/users?${params}`);
        if (res.data.meta) setTotal(res.data.meta.total);
        return res.data.data || [];
      },
      DEMO_CLIENTS
    ),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      await api.post('/users', { ...data, role: UserRole.CLIENT });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create client'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientForm> }) => {
      await api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted');
      setDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/users/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client status updated');
    },
  });

  const openCreate = () => {
    setEditingClient(null);
    form.reset({ password: '' });
    setDialogOpen(true);
  };

  const openEdit = (client: IUser) => {
    setEditingClient(client);
    form.reset({
      storeName: client.storeName || '',
      ownerName: client.ownerName || '',
      email: client.email,
      mobile: client.mobile,
      alternateMobile: client.alternateMobile || '',
      password: '',
      gstNumber: client.gstNumber || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      pincode: client.pincode || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    form.reset();
  };

  const onSubmit = (data: ClientForm) => {
    if (editingClient) {
      const { password, ...rest } = data;
      updateMutation.mutate({ id: editingClient._id, data: password ? data : rest });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: 'storeName', header: 'Store Name', sortable: true },
    { key: 'ownerName', header: 'Owner', sortable: true },
    { key: 'mobile', header: 'Mobile' },
    { key: 'email', header: 'Email' },
    {
      key: 'isActive',
      header: 'Status',
      render: (client: IUser) => (
        <Badge variant={client.isActive ? 'success' : 'secondary'}>
          {client.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage client accounts</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />

      <DataTable
        columns={columns}
        data={clients || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No clients found"
        emptyDescription="Add your first client to get started"
        keyExtractor={(c: IUser) => c._id}
        actions={(client: IUser) => (
          <div className="flex items-center gap-1">
            <Link href={`/orders?clientId=${client._id}`}>
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleMutation.mutate({ id: client._id, isActive: !client.isActive })}
            >
              {client.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setDeleteId(client._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Create Client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input {...form.register('storeName')} />
                {form.formState.errors.storeName && (
                  <p className="text-xs text-destructive">{form.formState.errors.storeName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input {...form.register('ownerName')} />
                {form.formState.errors.ownerName && (
                  <p className="text-xs text-destructive">{form.formState.errors.ownerName.message}</p>
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
                <Label>Alternate Mobile</Label>
                <Input {...form.register('alternateMobile')} />
              </div>
              <div className="space-y-2">
                <Label>Password {editingClient && '(leave blank to keep)'}</Label>
                <Input type="password" {...form.register('password')} />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input {...form.register('gstNumber')} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...form.register('city')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...form.register('address')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingClient ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
