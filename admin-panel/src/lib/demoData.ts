import { OrderStatus, UserRole, NotificationType } from '@/types';
import type { IDashboardStats, IOrder, IProduct, ICategory, IUser, INotification } from '@/types';

export const DEMO_DASHBOARD: IDashboardStats = {
  totalClients: 48,
  totalProducts: 156,
  totalCategories: 14,
  totalOrders: 342,
  revenue: 2850000,
  pendingOrders: 15,
  deliveredOrders: 298,
  lowStockProducts: 7,
  revenueTrend: [
    { date: 'Jan', amount: 185000 },
    { date: 'Feb', amount: 220000 },
    { date: 'Mar', amount: 195000 },
    { date: 'Apr', amount: 265000 },
    { date: 'May', amount: 240000 },
    { date: 'Jun', amount: 310000 },
  ],
  orderTrend: [
    { date: 'Jan', count: 42 },
    { date: 'Feb', count: 55 },
    { date: 'Mar', count: 48 },
    { date: 'Apr', count: 62 },
    { date: 'May', count: 58 },
    { date: 'Jun', count: 77 },
  ],
};

export const DEMO_ORDERS: IOrder[] = [
  {
    _id: 'ord-001', orderNumber: 'ORD-240601-7A3F', invoiceNumber: 'INV-240601-7A3F',
    client: { _id: 'cli-001', storeName: 'Newborn Care Center', email: '', mobile: '9876543210', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, createdAt: '', updatedAt: '' } as IUser,
    items: [], deliveryAddress: '123 Main St, Mumbai', contactNumber: '9876543210',
    status: OrderStatus.PENDING, subtotal: 4500, discount: 0, tax: 810, total: 5310,
    timeline: [{ status: OrderStatus.PENDING, timestamp: new Date().toISOString(), updatedBy: '' as any }],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'ord-002', orderNumber: 'ORD-240601-8B4G', invoiceNumber: 'INV-240601-8B4G',
    client: { _id: 'cli-002', storeName: 'Kids Paradise', email: '', mobile: '9876543211', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, createdAt: '', updatedAt: '' } as IUser,
    items: [], deliveryAddress: '456 Park Ave, Delhi', contactNumber: '9876543211',
    status: OrderStatus.ACCEPTED, subtotal: 8900, discount: 500, tax: 1512, total: 9912,
    expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    timeline: [{ status: OrderStatus.ACCEPTED, timestamp: new Date().toISOString(), updatedBy: '' as any }],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'ord-003', orderNumber: 'ORD-240531-9C5H', invoiceNumber: 'INV-240531-9C5H',
    client: { _id: 'cli-003', storeName: 'Diaper Depot', email: '', mobile: '9876543212', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, createdAt: '', updatedAt: '' } as IUser,
    items: [], deliveryAddress: '789 Mall Road, Bangalore', contactNumber: '9876543212',
    status: OrderStatus.DELIVERED, subtotal: 12500, discount: 1000, tax: 2070, total: 13570,
    timeline: [{ status: OrderStatus.DELIVERED, timestamp: new Date().toISOString(), updatedBy: '' as any }],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'ord-004', orderNumber: 'ORD-240530-0D6I', invoiceNumber: 'INV-240530-0D6I',
    client: { _id: 'cli-001', storeName: 'Newborn Care Center', email: '', mobile: '9876543210', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, createdAt: '', updatedAt: '' } as IUser,
    items: [], deliveryAddress: '123 Main St, Mumbai', contactNumber: '9876543210',
    status: OrderStatus.DISPATCHED, subtotal: 3200, discount: 0, tax: 576, total: 3776,
    timeline: [{ status: OrderStatus.DISPATCHED, timestamp: new Date().toISOString(), updatedBy: '' as any }],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'ord-005', orderNumber: 'ORD-240529-1E7J', invoiceNumber: 'INV-240529-1E7J',
    client: { _id: 'cli-004', storeName: 'Baby World', email: '', mobile: '9876543213', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, createdAt: '', updatedAt: '' } as IUser,
    items: [], deliveryAddress: '321 Lake View, Chennai', contactNumber: '9876543213',
    status: OrderStatus.ON_HOLD, subtotal: 6700, discount: 200, tax: 1170, total: 7670,
    holdReason: 'Awaiting payment confirmation',
    timeline: [{ status: OrderStatus.ON_HOLD, timestamp: new Date().toISOString(), updatedBy: '' as any }],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_PRODUCTS: IProduct[] = [
  { _id: 'prod-001', name: 'Baby Diaper Size M', sku: 'DIA-M-001', category: '664b...', brand: 'Pampers', price: 899, offerPrice: 749, images: [], stockQuantity: 150, lowStockThreshold: 20, isActive: true, salesCount: 230, createdAt: '', updatedAt: '' },
  { _id: 'prod-002', name: 'Baby Diaper Size L', sku: 'DIA-L-002', category: '664b...', brand: 'Pampers', price: 1099, offerPrice: 949, images: [], stockQuantity: 85, lowStockThreshold: 20, isActive: true, salesCount: 180, createdAt: '', updatedAt: '' },
  { _id: 'prod-003', name: 'Baby Wipes 100pk', sku: 'WIPE-100', category: '664c...', brand: 'Huggies', price: 299, offerPrice: 249, images: [], stockQuantity: 8, lowStockThreshold: 20, isActive: true, salesCount: 450, createdAt: '', updatedAt: '' },
  { _id: 'prod-004', name: 'Baby Oil 200ml', sku: 'OIL-200', category: '664c...', brand: 'Johnson', price: 199, offerPrice: 0, images: [], stockQuantity: 3, lowStockThreshold: 15, isActive: true, salesCount: 320, createdAt: '', updatedAt: '' },
  { _id: 'prod-005', name: 'Baby Shampoo 250ml', sku: 'SHAM-250', category: '664c...', brand: 'Johnson', price: 249, offerPrice: 199, images: [], stockQuantity: 200, lowStockThreshold: 20, isActive: true, salesCount: 280, createdAt: '', updatedAt: '' },
];

export const DEMO_CATEGORIES: ICategory[] = [
  { _id: 'cat-001', name: 'Child Care', slug: 'child-care', description: 'Child care products', isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' },
  { _id: 'cat-002', name: 'Newborn', slug: 'newborn', parent: 'cat-001', isActive: true, sortOrder: 2, createdAt: '', updatedAt: '' },
  { _id: 'cat-003', name: 'Adult Care', slug: 'adult-care', description: 'Adult care products', isActive: true, sortOrder: 3, createdAt: '', updatedAt: '' },
  { _id: 'cat-004', name: 'Hygiene', slug: 'hygiene', isActive: true, sortOrder: 4, createdAt: '', updatedAt: '' },
  { _id: 'cat-005', name: 'Food & Nutrition', slug: 'food-nutrition', isActive: true, sortOrder: 5, createdAt: '', updatedAt: '' },
  { _id: 'cat-006', name: 'Clothing', slug: 'clothing', isActive: true, sortOrder: 6, createdAt: '', updatedAt: '' },
  { _id: 'cat-007', name: 'Toys & Accessories', slug: 'toys-accessories', isActive: true, sortOrder: 7, createdAt: '', updatedAt: '' },
];

export const DEMO_CLIENTS: IUser[] = [
  { _id: 'cli-001', storeName: 'Newborn Care Center', ownerName: 'Rajesh Kumar', email: 'rajesh@example.com', mobile: '9876543210', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, city: 'Mumbai', state: 'Maharashtra', createdAt: '', updatedAt: '' } as IUser,
  { _id: 'cli-002', storeName: 'Kids Paradise', ownerName: 'Priya Sharma', email: 'priya@example.com', mobile: '9876543211', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, city: 'Delhi', state: 'Delhi', createdAt: '', updatedAt: '' } as IUser,
  { _id: 'cli-003', storeName: 'Diaper Depot', ownerName: 'Amit Singh', email: 'amit@example.com', mobile: '9876543212', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, city: 'Bangalore', state: 'Karnataka', createdAt: '', updatedAt: '' } as IUser,
  { _id: 'cli-004', storeName: 'Baby World', ownerName: 'Sneha Patel', email: 'sneha@example.com', mobile: '9876543213', role: UserRole.CLIENT, isActive: true, isLocked: false, mustChangePassword: false, loginAttempts: 0, city: 'Chennai', state: 'Tamil Nadu', createdAt: '', updatedAt: '' } as IUser,
];

export const DEMO_NOTIFICATIONS: INotification[] = [
  { _id: 'not-001', user: 'demo-admin-001', type: NotificationType.NEW_ORDER, title: 'New Order', message: 'Order ORD-240601-7A3F has been placed by Newborn Care Center', isRead: false, referenceId: 'ord-001', referenceModel: 'Order', createdAt: new Date(Date.now() - 600000).toISOString() },
  { _id: 'not-002', user: 'demo-admin-001', type: NotificationType.LOW_STOCK, title: 'Low Stock Alert', message: 'Baby Wipes 100pk is low on stock (8 remaining)', isRead: false, referenceId: 'prod-003', referenceModel: 'Product', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { _id: 'not-003', user: 'demo-admin-001', type: NotificationType.ORDER_DELIVERED, title: 'Order Delivered', message: 'Order ORD-240531-9C5H has been delivered to Diaper Depot', isRead: true, referenceId: 'ord-003', referenceModel: 'Order', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('demo_mode') === 'true';
}

export async function apiFallback<T>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
  if (isDemoMode()) return fallback;
  try {
    return await apiCall();
  } catch {
    localStorage.setItem('demo_mode', 'true');
    return fallback;
  }
}
