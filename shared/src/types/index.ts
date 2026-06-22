import { UserRole, OrderStatus, NotificationType, ActivityAction, InventoryAction } from '../enums';

export interface IUser {
  _id: string;
  storeName?: string;
  ownerName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  alternateMobile?: string;
  password?: string;
  role: UserRole;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  profileImage?: string;
  notes?: string;
  totalOrders?: number;
  isActive: boolean;
  isLocked: boolean;
  mustChangePassword: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | ICategory;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProductSize {
  name: string;
  mrp: number;
  salesPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface IProduct {
  _id: string;
  name: string;
  pieces: number;
  category: string | ICategory;
  mrp: number;
  salesPrice: number;
  images: string[];
  sizes: IProductSize[];
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  invoiceNumber: string;
  client: string | IUser;
  items: IOrderItem[];
  deliveryAddress: string;
  contactNumber: string;
  notes?: string;
  status: OrderStatus;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  timeline: ITimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  product: string | IProduct;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  size?: string;
}

export interface ITimelineEntry {
  status: OrderStatus;
  note?: string;
  timestamp: string;
  updatedBy: string | IUser;
}

export interface ICartItem {
  product: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  stockQuantity: number;
  size?: string;
}

export interface ICart {
  _id?: string;
  client: string;
  items: ICartItem[];
  updatedAt?: string;
}

export interface INotification {
  _id: string;
  user: string | IUser;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId?: string;
  referenceModel?: string;
  createdAt: string;
}

export interface IInventoryLog {
  _id: string;
  product: string | IProduct;
  action: InventoryAction;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceModel?: string;
  performedBy: string | IUser;
  notes?: string;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  user: string | IUser;
  action: ActivityAction;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ISettings {
  _id?: string;
  companyName: string;
  logo?: string;
  contactNumber: string;
  email: string;
  address: string;
  gstNumber?: string;
  invoicePrefix: string;
  lowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IJwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface IDashboardStats {
  totalClients: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
  revenueTrend: { date: string; amount: number }[];
  orderTrend: { date: string; count: number }[];
}

export interface IClientDashboard {
  recentOrders: IOrder[];
  accountSummary: {
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
  notifications: INotification[];
}

export interface IReportFilter {
  startDate?: string;
  endDate?: string;
  type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  clientId?: string;
  categoryId?: string;
}
