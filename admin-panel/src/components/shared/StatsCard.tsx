import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  iconColor?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'rounded-lg p-2 sm:p-3',
              iconColor || 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center text-xs sm:text-sm',
                trend.isUp ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isUp ? (
                <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="mt-2 sm:mt-4">
          <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          <p className="text-lg font-bold sm:text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
