import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '@mufar-commerce/shared';

export interface IProductDocument extends Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    brand: { type: String, trim: true },
    description: { type: String, trim: true },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    offerPrice: {
      type: Number,
      min: [0, 'Offer price cannot be negative'],
    },
    images: [{ type: String }],
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    isActive: { type: Boolean, default: true },
    salesCount: { type: Number, default: 0 },
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

productSchema.index({ name: 'text', sku: 'text', brand: 'text' });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model<IProductDocument>('Product', productSchema);
export default Product;
