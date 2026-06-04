export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES_EXECUTIVE = 'sales_executive',
  CLIENT = 'client',
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ON_HOLD = 'on_hold',
  REJECTED = 'rejected',
  READY_FOR_DISTRIBUTION = 'ready_for_distribution',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_ACCEPTED = 'order_accepted',
  ORDER_ON_HOLD = 'order_on_hold',
  ORDER_REJECTED = 'order_rejected',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_DISPATCHED = 'order_dispatched',
  ORDER_READY = 'order_ready',
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
