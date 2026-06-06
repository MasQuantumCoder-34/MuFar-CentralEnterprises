export interface User {
  _id: string;
  name?: string;
  storeName?: string;
  ownerName?: string;
  email: string;
  mobile?: string;
  role: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  productCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  brand?: string;
  category: string | Category;
  price: number;
  offerPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  unit: string;
  images: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: string | Product;
  quantity: number;
}

export interface OrderItem {
  product: string | Product;
  productName: string;
  productSku: string;
  productImage?: string;
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
  _id: string;
  orderNumber: string;
  client: string | User;
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
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

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceModel?: string;
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
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderPayload {
  deliveryAddress: string;
  contactNumber: string;
  notes?: string;
  items: { product: string; quantity: number }[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}
