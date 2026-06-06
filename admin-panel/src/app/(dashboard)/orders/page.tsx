'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Edit, XCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { IOrder, IApiResponse } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { useSearchParams } from 'next/navigation';

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const { page, limit, total, totalPages, setPage, setLimit, setTotal } = usePagination();

  const clientFilter = searchParams.get('clientId') || '';

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', page, limit, search, statusFilter, sortOrder, clientFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (sortOrder) {
        const order = sortOrder === 'newest' ? '-createdAt' : 'createdAt';
        params.set('sort', order);
      }
      if (clientFilter) params.set('clientId', clientFilter);
      const res = await api.get<IApiResponse<IOrder[]>>(`/orders?${params}`);
      if (res.data.meta) setTotal(res.data.meta.total);
      return res.data.data || [];
    },
  });

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (order: IOrder) => (
        <Link href={`/orders/${order._id}`} className="font-medium text-primary hover:underline">
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (order: IOrder) =>
        order.client && typeof order.client === 'object'
          ? order.client.storeName || order.client.name
          : order.client,
    },
    {
      key: 'items',
      header: 'Products',
      render: (order: IOrder) => (
        <span className="text-xs text-muted-foreground">
          {order.items.map(i => i.productName).join(', ')}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Amount',
      sortable: true,
      render: (order: IOrder) => `₹${order.total.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: IOrder) => <StatusBadge status={order.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (order: IOrder) => format(new Date(order.createdAt), 'dd MMM yyyy'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">View Orders</h1>
        <p className="text-muted-foreground">Browse order history and details</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by Order ID, Client, Product..." />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={orders || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No orders found"
        keyExtractor={(o: IOrder) => o._id}
        actions={(order: IOrder) => (
          <div className="flex items-center gap-1">
            <Link href={`/orders/${order._id}`}>
              <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </Link>
            {(order.status === 'pending' || order.status === 'processing') && (
              <>
                <Link href={`/orders/modify?orderId=${order._id}`}>
                  <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                </Link>
                <Link href={`/orders/cancel?orderId=${order._id}`}>
                  <Button variant="ghost" size="icon"><XCircle className="h-4 w-4" /></Button>
                </Link>
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}
