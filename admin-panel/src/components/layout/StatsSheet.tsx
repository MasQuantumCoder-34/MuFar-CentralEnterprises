'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Package,
  Tags,
  ShoppingCart,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { IDashboardStats, IApiResponse } from '@/types';

interface StatsSheetProps {
  children: React.ReactNode;
}

export default function StatsSheet({ children }: StatsSheetProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sidebar-stats'],
    queryFn: () => api.get<IApiResponse<IDashboardStats>>('/dashboard/admin').then(r => r.data.data),
  });

  const items = stats
    ? [
        { icon: Users, label: 'Total Clients', value: stats.totalClients },
        { icon: Package, label: 'Total Products', value: stats.totalProducts },
        { icon: Tags, label: 'Total Categories', value: stats.totalCategories },
        { icon: ShoppingCart, label: 'Total Orders', value: stats.totalOrders },
        { icon: IndianRupee, label: 'Revenue', value: `₹${(stats.revenue || 0).toLocaleString()}` },
        { icon: Clock, label: 'Pending Orders', value: stats.pendingOrders },
        { icon: CheckCircle, label: 'Delivered Orders', value: stats.deliveredOrders },
        { icon: AlertTriangle, label: 'Low Stock Products', value: stats.lowStockProducts },
      ]
    : [];

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Summary
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-bold">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
