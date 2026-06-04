export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'client' | 'admin' | 'staff';
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  children?: Category[];
  productCount?: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  slug: string;
  description: string;
  brand?: string;
  categoryId: number;
  categoryName?: string;
  price: number;
  offerPrice?: number;
  stock: number;
  unit: string;
  images: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'on_hold'
  | 'rejected'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  contactNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  statusHistory?: OrderStatusHistory[];
}

export interface OrderStatusHistory {
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface TrackEvent {
  id: number;
  status: OrderStatus;
  location?: string;
  note?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'order_update' | 'promotion' | 'system' | 'invoice';
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
  page?: number;
  limit?: number;
}

export interface CreateOrderPayload {
  deliveryAddress: string;
  contactNumber: string;
  notes?: string;
  items: { productId: number; quantity: number }[];
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
