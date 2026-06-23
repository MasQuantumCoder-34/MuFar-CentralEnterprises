import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  // processing: { label: 'Processing', variant: 'info' },
  // out_for_delivery: { label: 'Out for Delivery', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
