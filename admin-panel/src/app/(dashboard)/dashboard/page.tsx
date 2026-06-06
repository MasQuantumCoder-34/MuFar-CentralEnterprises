'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  ClipboardList,
  Edit,
  XCircle,
  FolderTree,
  Users,
  Package,
  ImageIcon,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { ICategory, IOrder, IUser, IApiResponse } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data: categories } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: () => api.get<IApiResponse<ICategory[]>>('/categories').then(r => r.data.data || []),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: () => api.get<IApiResponse<IOrder[]>>('/orders?limit=5').then(r => r.data.data || []),
    refetchInterval: 10000,
  });

  const { data: clients } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: () => api.get<IApiResponse<IUser[]>>('/users?role=client&limit=100').then(r => r.data.data || []),
    refetchInterval: 30000,
  });

  const actionCards = [
    { label: 'Create Order', icon: ShoppingCart, href: '/orders/create', desc: 'Create a new order for a client', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'View Orders', icon: ClipboardList, href: '/orders', desc: 'Browse and search all orders', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'Modify Orders', icon: Edit, href: '/orders/modify', desc: 'Edit pending or processing orders', color: 'bg-amber-500 hover:bg-amber-600' },
    { label: 'Cancel Orders', icon: XCircle, href: '/orders/cancel', desc: 'Cancel pending or processing orders', color: 'bg-red-500 hover:bg-red-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Internal B2B Order Management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className={`${card.color} text-white cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}>
                <CardContent className="p-6">
                  <Icon className="h-8 w-8 mb-3 opacity-90" />
                  <p className="text-lg font-bold">{card.label}</p>
                  <p className="text-sm text-white/80 mt-1">{card.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Categories
          </h2>
          <Link href="/categories" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {!categories ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderTree className="h-12 w-12 mb-3" />
            <p>No categories yet</p>
            <Link href="/categories"><Button variant="link" className="mt-2">Create your first category</Button></Link>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((cat) => (
              <Link key={cat._id} href={`/categories/${cat._id}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} width={80} height={80} className="object-cover w-full h-full" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{cat.name}</p>
                      {cat.productCount !== undefined && (
                        <p className="text-xs text-muted-foreground">{cat.productCount} products</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section> */}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Recent Orders
          </h2>
          <Link href="/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!recentOrders ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><LoadingSpinner /></TableCell></TableRow>
                ) : recentOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No recent orders</TableCell></TableRow>
                ) : (
                  recentOrders.map((order) => (
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Clients
          </h2>
          <Link href="/clients" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!clients ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><LoadingSpinner /></TableCell></TableRow>
                ) : clients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No clients yet</TableCell></TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell className="font-medium">{client.storeName || client.name}</TableCell>
                      <TableCell>{client.ownerName || '-'}</TableCell>
                      <TableCell>{client.mobile || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          {client.totalOrders ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/orders/create?clientId=${client._id}`}>
                            <Button variant="ghost" size="icon"><ShoppingCart className="h-4 w-4" /></Button>
                          </Link>
                          <Link href={`/orders?clientId=${client._id}`}>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
