export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES_EXECUTIVE = 'sales_executive',
  CLIENT = 'client',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_PROCESSING = 'order_processing',
  ORDER_OUT_FOR_DELIVERY = 'order_out_for_delivery',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  LOW_STOCK = 'low_stock',
}

export enum ActivityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  DISPATCH = 'dispatch',
  DELIVER = 'deliver',
  STOCK_ADJUST = 'stock_adjust',
}

export enum InventoryAction {
  STOCK_IN = 'stock_in',
  STOCK_OUT = 'stock_out',
  ADJUSTMENT = 'adjustment',
  ORDER_DEDUCTION = 'order_deduction',
}
