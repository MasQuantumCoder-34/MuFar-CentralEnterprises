'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Package,
  ArrowLeft,
  ShoppingCart,
  ImageIcon,
  Plus,
  Minus,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import type { IProduct, ICategory, IUser, IApiResponse } from '@/types';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [orderDialog, setOrderDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderQty, setOrderQty] = useState(1);

  const { data: category } = useQuery({
    queryKey: ['category', id],
    queryFn: () => api.get<IApiResponse<ICategory>>(`/categories/${id}`).then(r => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['category-products', id],
    queryFn: () => api.get<IApiResponse<IProduct[]>>(`/products?category=${id}`).then(r => r.data.data || []),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', 'for-order'],
    queryFn: () => api.get<IApiResponse<IUser[]>>('/users?role=client&limit=100').then(r => r.data.data || []),
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !selectedClientId) return;
      await api.post('/orders', {
        clientId: selectedClientId,
        items: [{ product: selectedProduct._id, quantity: orderQty }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Order created successfully');
      setOrderDialog(false);
      setSelectedProduct(null);
      setSelectedClientId('');
      setOrderQty(1);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create order'),
  });

  const openOrderDialog = (product: IProduct) => {
    setSelectedProduct(product);
    setOrderQty(1);
    setOrderDialog(true);
  };

  if (!category) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
            {category.image ? (
              <Image src={category.image} alt={category.name} width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">{category.description || `${products?.length || 0} products`}</p>
          </div>
        </div>
      </div>

      {!products ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products in this category"
          description="Products will appear here once added"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} width={200} height={160} className="object-cover w-full h-full" />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                <p className="text-lg font-bold text-primary">₹{product.mrp.toLocaleString()}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Stock: {product.stockQuantity}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => openOrderDialog(product)}
                  disabled={product.stockQuantity <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add Order
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted-foreground/20 flex items-center justify-center">
                  {selectedProduct.images?.[0] ? (
                    <Image src={selectedProduct.images[0]} alt={selectedProduct.name} width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground">MRP: ₹{selectedProduct.mrp} | Stock: {selectedProduct.stockQuantity}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.storeName || client.name || client.email || client.mobile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                    disabled={orderQty <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center"
                    min={1}
                    max={selectedProduct.stockQuantity}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setOrderQty(Math.min(selectedProduct.stockQuantity, orderQty + 1))}
                    disabled={orderQty >= selectedProduct.stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-bold">₹{(selectedProduct.mrp * orderQty).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog(false)}>Cancel</Button>
            <Button onClick={() => createOrder.mutate()} disabled={!selectedClientId || createOrder.isPending}>
              {createOrder.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
