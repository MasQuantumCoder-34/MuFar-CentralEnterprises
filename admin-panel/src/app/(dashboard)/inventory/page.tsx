'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertTriangle,
  Package,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { IProduct, IInventoryLog, IApiResponse } from '@/types';
import { InventoryAction } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { format } from 'date-fns';

const adjustmentSchema = z.object({
  quantity: z.coerce.number().int(),
  notes: z.string().optional(),
});

type AdjustmentForm = z.infer<typeof adjustmentSchema>;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const { page, limit, total, totalPages, setPage, setLimit, setTotal } = usePagination();

  const form = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      const res = await api.get<IApiResponse<IProduct[]>>(`/products?${params}`);
      if (res.data.meta) setTotal(res.data.meta.total);
      return res.data.data || [];
    },
  });

  const { data: inventoryLogs } = useQuery({
    queryKey: ['inventory-logs'],
    queryFn: async () => {
      const res = await api.get<IApiResponse<IInventoryLog[]>>('/inventory/logs?limit=10');
      return res.data.data || [];
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (data: { productId: string; quantity: number; notes?: string }) => {
      await api.post('/inventory/adjust', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-logs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock adjusted');
      setDialogOpen(false);
      setSelectedProduct(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Adjustment failed'),
  });

  const openAdjust = (product: IProduct, type: 'stock_in' | 'stock_out') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    form.reset({ quantity: 0, notes: '' });
    setDialogOpen(true);
  };

  const onSubmit = (data: AdjustmentForm) => {
    if (!selectedProduct) return;
    const quantity = adjustmentType === 'stock_out' ? -Math.abs(data.quantity) : Math.abs(data.quantity);
    adjustMutation.mutate({
      productId: selectedProduct._id,
      quantity,
      notes: data.notes,
    });
  };

  const lowStockProducts = (products || []).filter(
    (p) => p.stockQuantity <= p.lowStockThreshold
  );

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
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        ),
    },
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    {
      key: 'stockQuantity',
      header: 'Stock',
      render: (product: IProduct) => (
        <span
          className={
            product.stockQuantity <= product.lowStockThreshold
              ? 'font-bold text-destructive'
              : ''
          }
        >
          {product.stockQuantity}
        </span>
      ),
    },
    {
      key: 'lowStockThreshold',
      header: 'Threshold',
      render: (product: IProduct) => product.lowStockThreshold,
    },
    {
      key: 'status',
      header: 'Status',
      render: (product: IProduct) =>
        product.stockQuantity <= product.lowStockThreshold ? (
          <Badge variant="destructive" className="flex w-fit items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </Badge>
        ) : product.stockQuantity === 0 ? (
          <Badge variant="destructive">Out of Stock</Badge>
        ) : (
          <Badge variant="success">In Stock</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Manage product stock levels</p>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm">
              <strong>{lowStockProducts.length}</strong> product(s) are running low on stock
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="logs">Inventory Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />

          <DataTable
            columns={columns}
            data={products || []}
            loading={isLoading}
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
            emptyTitle="No products found"
            keyExtractor={(p: IProduct) => p._id}
            actions={(product: IProduct) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAdjust(product, 'stock_in')}
                >
                  Stock In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAdjust(product, 'stock_out')}
                >
                  Stock Out
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Inventory Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {(!inventoryLogs || inventoryLogs.length === 0) ? (
                <p className="text-center text-sm text-muted-foreground">No inventory logs</p>
              ) : (
                <div className="space-y-3">
                  {inventoryLogs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {typeof log.product === 'object' ? log.product.name : 'Product'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.action.replace(/_/g, ' ')} | Previous: {log.previousStock} → New:{' '}
                            {log.newStock}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}</p>
                        {log.notes && <p className="italic">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'stock_in' ? 'Stock In' : 'Stock Out'} -{' '}
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Stock: {selectedProduct?.stockQuantity}</Label>
            </div>
            <div className="space-y-2">
              <Label>Quantity to {adjustmentType === 'stock_in' ? 'add' : 'remove'}</Label>
              <Input
                type="number"
                {...form.register('quantity')}
                min={1}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input {...form.register('notes')} placeholder="Reason for adjustment" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedProduct(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Adjusting...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
