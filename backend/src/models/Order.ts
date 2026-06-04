import mongoose, { Schema, Document } from 'mongoose';
import { IOrder, IOrderItem, ITimelineEntry, OrderStatus } from '@mufar-commerce/shared';

export interface IOrderDocument extends Omit<IOrder, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const timelineEntrySchema = new Schema<ITimelineEntry>(
  {
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    note: { type: String },
    timestamp: { type: String, default: () => new Date().toISOString() },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client is required'],
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    deliveryAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    rejectionReason: { type: String },
    holdReason: { type: String },
    expectedDeliveryDate: { type: Date },
    approvedAt: { type: Date },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    timeline: { type: [timelineEntrySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ invoiceNumber: 1 });
orderSchema.index({ client: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
export default Order;
