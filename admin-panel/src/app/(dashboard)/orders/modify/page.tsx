'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  Edit,
  Plus,
  Minus,
  Trash2,
  Package,
  ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { IOrder, IProduct, IApiResponse } from '@/types';

interface EditableItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  image?: string;
  size?: string;
}

function getProductId(item: { product: string | IProduct }): string {
  return typeof item.product === 'object' && item.product !== null
    ? (item.product as any)._id || String(item.product)
    : String(item.product);
}

function getProductImage(item: { product: string | IProduct }): string | undefined {
  return typeof item.product === 'object' && item.product !== null
    ? (item.product as any).images?.[0]
    : undefined;
}

export default function ModifyOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedOrderId = searchParams.get('orderId');

  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [editDialog, setEditDialog] = useState(false);
  const [localItems, setLocalItems] = useState<EditableItem[]>([]);
  const [editedNotes, setEditedNotes] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'pending-processing'],
    staleTime: 30 * 1000,
    queryFn: () => api.get<IApiResponse<IOrder[]>>('/orders?status=pending,processing&limit=100').then(r => r.data.data || []),
    refetchInterval: 15000,
  });

  const selectedOrder = orders?.find(o => o._id === selectedOrderId) || (preselectedOrderId ? undefined : null);

  const openEdit = (order: IOrder) => {
    setSelectedOrderId(order._id);
    setLocalItems(
      order.items.map((item) => ({
        productId: getProductId(item),
        productName: item.productName,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        stockQuantity: 9999,
        image: getProductImage(item),
        size: item.size,
      }))
    );
    setEditedNotes(order.notes || '');
    setEditDialog(true);
  };

  const updateQty = (productId: string, qty: number) => {
    setLocalItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, qty) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setLocalItems(prev => prev.filter(item => item.productId !== productId));
  };

  const totalProducts = localItems.length;
  const totalQty = localItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const items = localItems.map(item => ({ product: item.productId, quantity: item.quantity, size: item.size }));
      await api.put(`/orders/${selectedOrderId}`, { items, notes: editedNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order modified successfully');
      setEditDialog(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to modify order'),
  });

  const editableOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modify Orders</h1>
          <p className="text-muted-foreground">Edit pending or processing orders</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !editableOrders || editableOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Edit className="h-12 w-12 mb-3" />
            <p>No orders available to modify</p>
            <p className="text-sm">Only pending and processing orders can be modified</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editableOrders.map((order) => (
            <Card key={order._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.client && typeof order.client === 'object'
                        ? order.client.storeName || order.client.name
                        : order.client}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">Items: {order.items.length}</p>
                  <p className="text-muted-foreground">Total: ₹{order.total.toLocaleString()}</p>
                  <p className="text-muted-foreground">{format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => openEdit(order)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Link href={`/orders/${order._id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modify Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Order Items</Label>
                {localItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">All items removed. Add items via order edit.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {localItems.map((item) => {
                      const lineTotal = item.price * item.quantity;
                      return (
                        <div key={item.productId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted-foreground/20 flex-shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <Image src={item.image} alt={item.productName} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.productName}
                              {item.size && <span className="text-muted-foreground ml-1">({item.size})</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString()} / unit</p>
                            <p className="text-xs text-muted-foreground">Line: ₹{lineTotal.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQty(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQty(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-14 h-8 text-center text-sm"
                              min={1}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQty(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeItem(item.productId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Products</span>
                  <span>{totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quantity</span>
                  <span>{totalQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Client Notes</Label>
                <Input
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || localItems.length === 0}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
