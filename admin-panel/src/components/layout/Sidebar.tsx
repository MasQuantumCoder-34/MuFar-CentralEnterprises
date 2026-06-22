'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  PackageSearch,
  Bell,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  BarChartHorizontal,
  Store,
  ChevronLeft,
  BarChart4,
  Edit,
  XCircle,
} from 'lucide-react';
import StatsSheet from './StatsSheet';

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  children?: { href: string; label: string; icon: any }[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Orders',
    icon: ShoppingCart,
    children: [
      { href: '/orders/create', label: 'Create Order', icon: ShoppingCart },
      { href: '/orders', label: 'View Orders', icon: ClipboardList },
      { href: '/orders/modify', label: 'Modify Orders', icon: Edit },
      { href: '/orders/cancel', label: 'Cancel Orders', icon: XCircle },
    ],
  },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: PackageSearch },
  {
    label: 'Analytics',
    icon: BarChartHorizontal,
    children: [
      { href: '/analytics/revenue', label: 'Revenue Trend', icon: TrendingUp },
      { href: '/analytics/orders', label: 'Order Trend', icon: BarChart3 },
    ],
  },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: Shield, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Store className="h-6 w-6 text-primary" />
            <span>Central Enterprises</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            <StatsSheet>
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground mb-1">
                <BarChart4 className="h-4 w-4" />
                <span className="text-sm font-medium">View Stats</span>
              </Button>
            </StatsSheet>
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) {
                return null;
              }

              if (item.children) {
                const isExpanded = expandedMenus[item.label] ?? isActive(item.children[0]?.href || '#');
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isExpanded
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {isExpanded ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                childActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <ChildIcon className="h-4 w-4" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;
              const active = item.href ? isActive(item.href) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
