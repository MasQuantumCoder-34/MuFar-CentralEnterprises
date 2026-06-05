'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
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
  Users,
  Package,
  Tags,
  ShoppingCart,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import type { IDashboardStats, IOrder, IApiResponse } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<IApiResponse<IDashboardStats>>('/dashboard/admin').then(r => r.data.data!),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => api.get<IApiResponse<IOrder[]>>('/orders?limit=5&sort=-createdAt').then(r => r.data.data || []),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return <div className="text-destructive">Failed to load dashboard</div>;

  const statCards = [
    { icon: Users, label: 'Total Clients', value: stats.totalClients },
    { icon: Package, label: 'Total Products', value: stats.totalProducts },
    { icon: Tags, label: 'Total Categories', value: stats.totalCategories },
    { icon: ShoppingCart, label: 'Total Orders', value: stats.totalOrders },
    { icon: IndianRupee, label: 'Revenue', value: `₹${(stats.revenue || 0).toLocaleString()}` },
    { icon: Clock, label: 'Pending Orders', value: stats.pendingOrders },
    { icon: CheckCircle, label: 'Delivered Orders', value: stats.deliveredOrders },
    { icon: AlertTriangle, label: 'Low Stock Products', value: stats.lowStockProducts, iconColor: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">
          Welcome{user?.name || user?.storeName || user?.ownerName ? `, ${user?.name || user?.storeName || user?.ownerName}` : ''}!
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">Overview of your commerce platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatsCard key={s.label} icon={s.icon} label={s.label} value={s.value} iconColor={s.iconColor} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.orderTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Link href="/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentOrders || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent orders
                  </TableCell>
                </TableRow>
              ) : (
                (recentOrders || []).map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <Link href={`/orders/${order._id}`} className="font-medium text-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {typeof order.client === 'object' ? order.client.storeName || order.client.name : order.client}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>₹{order.total.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
