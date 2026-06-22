'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Printer,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ORDER_STATUS_FLOW } from '@/types';
import type { IOrder, ITimelineEntry, IApiResponse } from '@/types';
import Link from 'next/link';

const statusUpdateSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
});

type StatusUpdateForm = z.infer<typeof statusUpdateSchema>;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    staleTime: 30 * 1000,
    queryFn: () => api.get<IApiResponse<IOrder>>(`/orders/${id}`).then(r => r.data.data!),
  });

  const form = useForm<StatusUpdateForm>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: '' },
  });

  const selectedStatus = form.watch('status');
  const currentStatus = order?.status || '';

  const availableNextStatuses = ORDER_STATUS_FLOW[currentStatus] || [];

  const updateMutation = useMutation({
    mutationFn: async (data: StatusUpdateForm) => {
      const payload: Record<string, string> = { status: data.status };
      if (data.notes) payload.notes = data.notes;
      await api.put(`/orders/${id}/status`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
      form.reset({ status: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status'),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/orders/${id}/status`, { status: 'cancelled', notes: 'Cancelled by admin' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
      setShowCancelDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
      setShowDeleteDialog(false);
      router.push('/orders');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete order'),
  });

  const handleStatusUpdate = (data: StatusUpdateForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="text-destructive">Order not found</div>;

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground">
            Invoice: {order.invoiceNumber} | {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.size || '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{item.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 space-y-1 border-t pt-4 text-right">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.client && typeof order.client === 'object' && (
                <>
                  <p><span className="text-muted-foreground">Name:</span> {order.client.storeName || order.client.name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {order.client.email}</p>
                  <p><span className="text-muted-foreground">Mobile:</span> {order.client.mobile}</p>
                </>
              )}
              <p><span className="text-muted-foreground">Delivery:</span> {order.deliveryAddress}</p>
              <p><span className="text-muted-foreground">Contact:</span> {order.contactNumber}</p>
              {order.notes && <p><span className="text-muted-foreground">Notes:</span> {order.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              {availableNextStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No further status updates available.</p>
              ) : (
                <form onSubmit={form.handleSubmit(handleStatusUpdate)} className="space-y-3">
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(v) => form.setValue('status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableNextStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input {...form.register('notes')} placeholder="Additional notes" />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedStatus || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Status'}
                  </Button>
                </form>
              )}
              {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              )}
              {(currentStatus === 'pending' || currentStatus === 'cancelled') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-destructive border-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </Button>
              )}
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.timeline?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline entries</p>
            ) : (
              (order.timeline || []).map((entry: ITimelineEntry, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {entry.status === 'delivered' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : entry.status === 'cancelled' ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {i < (order.timeline?.length || 0) - 1 && (
                      <div className="h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.timestamp), 'dd MMM yyyy HH:mm')}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
                    )}
                    {typeof entry.updatedBy === 'object' && entry.updatedBy && (
                      <p className="text-xs text-muted-foreground">
                        by {entry.updatedBy.name || entry.updatedBy.email}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancel Order"
        description={`Are you sure you want to cancel order ${order.orderNumber}?`}
        confirmLabel="Cancel Order"
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
      />
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Order"
        description={`Are you sure you want to permanently delete order ${order.orderNumber}? This cannot be undone.`}
        confirmLabel="Delete Order"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
