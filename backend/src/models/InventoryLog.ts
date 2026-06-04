import mongoose, { Schema, Document } from 'mongoose';
import { IInventoryLog, InventoryAction } from '@mufar-commerce/shared';

export interface IInventoryLogDocument extends Omit<IInventoryLog, '_id' | 'createdAt'>, Document {}

const inventoryLogSchema = new Schema<IInventoryLogDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(InventoryAction),
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceId: { type: String },
    referenceModel: { type: String },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: { type: String },
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

inventoryLogSchema.index({ product: 1 });
inventoryLogSchema.index({ createdAt: -1 });

const InventoryLog = mongoose.model<IInventoryLogDocument>('InventoryLog', inventoryLogSchema);
export default InventoryLog;
