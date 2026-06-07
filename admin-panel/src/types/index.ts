export { UserRole, OrderStatus, NotificationType, ActivityAction, InventoryAction } from './enums';
export type {
  IUser, ICategory, IProduct, IProductSize, IOrder, IOrderItem, ITimelineEntry,
  ICartItem, ICart, INotification, IInventoryLog, IActivityLog, ISettings,
  ILoginRequest, ILoginResponse, IApiResponse, IJwtPayload, IDashboardStats,
  IClientDashboard, IReportFilter,
} from './models';
export { ORDER_STATUS_FLOW, PAGINATION, CURRENCY } from './constants';

export interface UpdateOrderStatusInput {
  status: string;
  notes?: string;
}

export interface CreateOrderInput {
  deliveryAddress?: string;
  contactNumber?: string;
  notes?: string;
  items: { product: string; quantity: number; size?: string }[];
}

export interface CreateProductInput {
  name: string;
  category: string;
  mrp: number;
  salesPrice: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  images?: string[];
  sizes?: { name: string; mrp: number; salesPrice: number }[];
}

export interface CreateUserInput {
  storeName: string;
  ownerName: string;
  mobile: string;
  email: string;
  role: string;
  password: string;
}
