import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'info' },
  on_hold: { label: 'On Hold', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  ready_for_distribution: { label: 'Ready for Dist.', variant: 'info' },
  dispatched: { label: 'Dispatched', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
