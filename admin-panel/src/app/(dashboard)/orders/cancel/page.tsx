'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { IOrder, IApiResponse } from '@/types';

export default function CancelOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedOrderId = searchParams.get('orderId');

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(preselectedOrderId || null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'pending-processing'],
    staleTime: 30 * 1000,
    queryFn: () => api.get<IApiResponse<IOrder[]>>('/orders?status=pending,processing&limit=100').then(r => r.data.data || []),
    refetchInterval: 15000,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelOrderId) return;
      await api.put(`/orders/${cancelOrderId}/status`, {
        status: 'cancelled',
        notes: cancelReason || 'Cancelled by admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'pending-processing'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'recent'] });
      toast.success('Order cancelled successfully');
      setCancelOrderId(null);
      setCancelReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to cancel order'),
  });

  const cancellableOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing');
  const selectedOrder = orders?.find(o => o._id === cancelOrderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Cancel Orders</h1>
          <p className="text-muted-foreground">Cancel pending or processing orders</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !cancellableOrders || cancellableOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <XCircle className="h-12 w-12 mb-3" />
            <p>No orders available to cancel</p>
            <p className="text-sm">Only pending and processing orders can be cancelled</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancellableOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      {order.client && typeof order.client === 'object'
                        ? order.client.storeName || order.client.name
                        : order.client}
                    </TableCell>
                    <TableCell>₹{order.total.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/orders/${order._id}`}>
                          <Button variant="ghost" size="icon">View</Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { setCancelOrderId(order._id); setCancelReason(''); }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!cancelOrderId && !!selectedOrder}
        onOpenChange={(open) => { if (!open) setCancelOrderId(null); }}
        title="Cancel Order"
        description={
          <div className="space-y-3">
            <p>Are you sure you want to cancel order <strong>{selectedOrder?.orderNumber}</strong>?</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Stock will be restored automatically.
            </p>
            <div className="space-y-1">
              <Label>Cancellation Reason</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Optional reason..."
              />
            </div>
          </div>
        }
        confirmLabel="Cancel Order"
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
