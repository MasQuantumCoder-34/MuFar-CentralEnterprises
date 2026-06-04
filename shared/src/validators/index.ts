import { z } from 'zod';
import { UserRole, OrderStatus } from '../enums';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateUserSchema = z.object({
  storeName: z.string().optional(),
  ownerName: z.string().optional(),
  mobile: z.string().optional(),
  alternateMobile: z.string().optional(),
  email: z.string().email().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  profileImage: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  offerPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0, 'Stock must be 0 or more'),
  lowStockThreshold: z.number().int().min(0).default(10),
  images: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parent: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createOrderSchema = z.object({
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  contactNumber: z.string().min(10, 'Valid contact number required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    product: z.string().min(1),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  rejectionReason: z.string().optional(),
  holdReason: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(),
  notes: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  companyName: z.string().optional(),
  logo: z.string().optional(),
  contactNumber: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
