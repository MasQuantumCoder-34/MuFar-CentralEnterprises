'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ImageUpload from '@/components/shared/ImageUpload';
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
  ImageIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { IProduct, ICategory, IApiResponse } from '@/types';
import { usePagination } from '@/hooks/usePagination';

const SIZES = ['SM', 'M', 'L', 'XL', 'XXL'];

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  mrp: z.coerce.number().positive('MRP must be positive'),
  salesPrice: z.coerce.number().positive('Sales price must be positive'),
  sizes: z.array(z.object({
    name: z.string(),
    mrp: z.coerce.number().positive(),
    salesPrice: z.coerce.number().positive(),
  })).default([]),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { page, limit, total, totalPages, setPage, setLimit, setTotal } = usePagination();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      images: [],
      isActive: true,
      lowStockThreshold: 10,
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, limit, search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      const res = await api.get<IApiResponse<IProduct[]>>(`/products?${params}`);
      if (res.data.meta) {
        setTotal(res.data.meta.total);
      }
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<IApiResponse<ICategory[]>>('/categories');
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      await api.post('/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductForm> }) => {
      await api.put(`/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete product'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/products/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product status updated');
    },
  });

  const openCreate = () => {
    setEditingProduct(null);
    form.reset({ images: [], isActive: true, lowStockThreshold: 10 });
    setDialogOpen(true);
  };

  const openEdit = (product: IProduct) => {
    setEditingProduct(product);
    const sizes = (product.sizes || []).map((s: any) =>
      typeof s === 'string' ? { name: s, mrp: product.mrp, salesPrice: product.salesPrice } : s
    );
    form.reset({
      name: product.name,
      category: typeof product.category === 'string' ? product.category : product.category._id,
      mrp: product.mrp,
      salesPrice: product.salesPrice,
      sizes,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      images: product.images || [],
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const onSubmit = (data: ProductForm) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      key: 'image',
      header: '',
      render: (product: IProduct) =>
        product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        ),
    },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'category',
      header: 'Category',
      render: (product: IProduct) =>
        product.category && typeof product.category === 'object' ? product.category.name : 'N/A',
    },
    {
      key: 'mrp',
      header: 'MRP',
      sortable: true,
      render: (product: IProduct) => `₹${product.mrp.toLocaleString()}`,
    },
    {
      key: 'salesPrice',
      header: 'Sales Price',
      sortable: true,
      render: (product: IProduct) => `₹${(product.salesPrice ?? product.mrp).toLocaleString()}`,
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      sortable: true,
      render: (product: IProduct) => (
        <Badge variant={product.stockQuantity <= product.lowStockThreshold ? 'destructive' : 'secondary'}>
          {product.stockQuantity}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (product: IProduct) => (
        <Badge variant={product.isActive ? 'success' : 'secondary'}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(categories || []).map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={productsData || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No products found"
        emptyDescription="Get started by creating your first product"
        keyExtractor={(p: IProduct) => p._id}
        actions={(product: IProduct) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                toggleMutation.mutate({ id: product._id, isActive: !product.isActive })
              }
            >
              {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setDeleteId(product._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
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
              <Label>Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(v) => form.setValue('category', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories || []).map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>MRP (₹)</Label>
                <Input type="number" step="0.01" {...form.register('mrp')} />
                {form.formState.errors.mrp && (
                  <p className="text-xs text-destructive">{form.formState.errors.mrp.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Sales Price (₹)</Label>
                <Input type="number" step="0.01" {...form.register('salesPrice')} />
                {form.formState.errors.salesPrice && (
                  <p className="text-xs text-destructive">{form.formState.errors.salesPrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input type="number" {...form.register('stockQuantity')} />
                {form.formState.errors.stockQuantity && (
                  <p className="text-xs text-destructive">{form.formState.errors.stockQuantity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input type="number" {...form.register('lowStockThreshold')} />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Sizes with Pricing</Label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((sizeName) => {
                  const currentSizes = form.watch('sizes') || [];
                  const existing = currentSizes.find((s: any) => s.name === sizeName);
                  return (
                    <button
                      key={sizeName}
                      type="button"
                      onClick={() => {
                        const current = form.watch('sizes') || [];
                        if (existing) {
                          form.setValue('sizes', current.filter((s: any) => s.name !== sizeName));
                        } else {
                          form.setValue('sizes', [...current, { name: sizeName, mrp: form.watch('mrp'), salesPrice: form.watch('salesPrice') }]);
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        existing
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:bg-muted'
                      }`}
                    >
                      {sizeName}
                      {existing && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
              {(form.watch('sizes') || []).length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  {(form.watch('sizes') || []).map((size: any, index: number) => (
                    <div key={size.name} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-8">{size.name}</span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="MRP"
                            value={size.mrp}
                            onChange={(e) => {
                              const updated = [...(form.watch('sizes') || [])];
                              updated[index] = { ...updated[index], mrp: parseFloat(e.target.value) || 0 };
                              form.setValue('sizes', updated);
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Sales"
                            value={size.salesPrice}
                            onChange={(e) => {
                              const updated = [...(form.watch('sizes') || [])];
                              updated[index] = { ...updated[index], salesPrice: parseFloat(e.target.value) || 0 };
                              form.setValue('sizes', updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload
                images={form.watch('images') || []}
                onChange={(urls) => form.setValue('images', urls)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
