'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { apiFallback, DEMO_ORDERS } from '@/lib/demoData';
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
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { IOrder, IApiResponse } from '@/types';
import { usePagination } from '@/hooks/usePagination';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { page, limit, total, totalPages, setPage, setLimit, setTotal } = usePagination();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', page, limit, search, statusFilter],
    queryFn: () => apiFallback(
      async () => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        const res = await api.get<IApiResponse<IOrder[]>>(`/orders?${params}`);
        if (res.data.meta) setTotal(res.data.meta.total);
        return res.data.data || [];
      },
      DEMO_ORDERS
    ),
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
        typeof order.client === 'object'
          ? order.client.storeName || order.client.name
          : order.client,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: IOrder) => <StatusBadge status={order.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (order: IOrder) => `₹${order.total.toLocaleString()}`,
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
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="ready_for_distribution">Ready for Dist.</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
          <Link href={`/orders/${order._id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        )}
      />
    </div>
  );
}
