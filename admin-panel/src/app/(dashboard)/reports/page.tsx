'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Download, Package, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface SalesReport {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
}

interface TopCustomer {
  _id: string;
  storeName: string;
  totalOrders: number;
  totalSpent: number;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('monthly');

  const { data: salesData, isLoading: salesLoading } = useQuery<SalesReport[]>({
    queryKey: ['reports', 'sales', reportType],
    queryFn: async () => {
      const res = await api.get(`/reports/sales?type=${reportType}`);
      return (res.data?.data?.breakdown || []) as SalesReport[];
    },
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['reports', 'top-customers'],
    queryFn: async () => {
      const res = await api.get('/reports/customers');
      return (res.data?.data?.topCustomers || []) as TopCustomer[];
    },
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/reports/inventory');
      return (res.data?.data?.lowStockProducts || []) as any[];
    },
  });

  const exportCSV = async (type: string) => {
    try {
      const res = await api.get(`/reports/export?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights</p>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportCSV('sales')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {salesLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="totalRevenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sales Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!salesData || salesData.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No data
                          </TableCell>
                        </TableRow>
                      ) : (
                        salesData.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.period}</TableCell>
                            <TableCell>{row.totalOrders}</TableCell>
                            <TableCell>{row.totalItems}</TableCell>
                            <TableCell>₹{row.totalRevenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Low Stock & Out of Stock Products</h3>
            <Button variant="outline" onClick={() => exportCSV('inventory')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {(!lowStockData || lowStockData.length === 0) ? (
                <div className="flex flex-col items-center py-12">
                  <Package className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">All products are well stocked</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockData.map((item: any) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell className="text-destructive font-bold">
                          {item.stockQuantity}
                        </TableCell>
                        <TableCell>{item.lowStockThreshold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Top Customers</h3>
            <Button variant="outline" onClick={() => exportCSV('customers')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {(!topCustomers || topCustomers.length === 0) ? (
                <div className="flex flex-col items-center py-12">
                  <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No customer data</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer, i) => (
                      <TableRow key={customer._id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{customer.storeName}</TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>₹{customer.totalSpent.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
