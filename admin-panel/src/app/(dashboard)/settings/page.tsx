'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import type { ISettings, IApiResponse } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Smartphone, Download } from 'lucide-react';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactNumber: z.string().min(10, 'Valid contact number required'),
  email: z.string().email('Invalid email'),
  address: z.string().min(1, 'Address is required'),
  gstNumber: z.string().optional(),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  lowStockThreshold: z.coerce.number().int().min(0),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<IApiResponse<ISettings>>('/settings');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        companyName: settings.companyName,
        contactNumber: settings.contactNumber,
        email: settings.email,
        address: settings.address,
        gstNumber: settings.gstNumber || '',
        invoicePrefix: settings.invoicePrefix,
        lowStockThreshold: settings.lowStockThreshold,
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      await api.put('/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update settings'),
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your company settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input {...form.register('companyName')} />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-destructive">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input {...form.register('contactNumber')} />
                {form.formState.errors.contactNumber && (
                  <p className="text-xs text-destructive">{form.formState.errors.contactNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input {...form.register('gstNumber')} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Prefix</Label>
                <Input {...form.register('invoicePrefix')} />
                {form.formState.errors.invoicePrefix && (
                  <p className="text-xs text-destructive">{form.formState.errors.invoicePrefix.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input type="number" {...form.register('lowStockThreshold')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...form.register('address')}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Mobile App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download the Mufar Central Enterprises mobile app for Android.
            Manage orders, browse products, and stay connected on the go.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="default" className="w-full sm:w-auto">
              <a
                href="https://github.com/MasQuantumCoder-34/MuFar-CentralEnterprises/releases/download/v1.0.0/app-release.apk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download APK (v1.0.0)
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              APK size: ~52MB · Android 8.0+ required
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
