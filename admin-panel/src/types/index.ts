export { UserRole, OrderStatus, NotificationType, ActivityAction, InventoryAction } from './enums';
export type {
  IUser, ICategory, IProduct, IOrder, IOrderItem, ITimelineEntry,
  ICartItem, ICart, INotification, IInventoryLog, IActivityLog, ISettings,
  ILoginRequest, ILoginResponse, IApiResponse, IJwtPayload, IDashboardStats,
  IClientDashboard, IReportFilter,
} from './models';
export { ORDER_STATUS_FLOW, PAGINATION, CURRENCY } from './constants';

export interface UpdateOrderStatusInput {
  status: string;
  rejectionReason?: string;
  holdReason?: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface CreateOrderInput {
  deliveryAddress: string;
  contactNumber: string;
  notes?: string;
  items: { product: string; quantity: number }[];
}

export interface CreateProductInput {
  name: string;
  sku: string;
  category: string;
  brand?: string;
  description?: string;
  price: number;
  offerPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  images?: string[];
}

export interface CreateUserInput {
  storeName: string;
  ownerName: string;
  mobile: string;
  email: string;
  role: string;
  password: string;
}
