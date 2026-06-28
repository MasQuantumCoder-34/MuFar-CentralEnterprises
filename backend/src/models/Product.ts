import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '@mufar-commerce/shared';

export interface IProductDocument extends Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const productSizeSchema = new Schema(
  {
    name: { type: String, required: true },
    mrp: { type: Number, required: true, min: 0 },
    salesPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { _id: false }
);

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    pieces: {
      type: Number,
      default: 1,
      min: [0, 'Pieces cannot be negative'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative'],
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price cannot be negative'],
      default: 0,
    },
    images: [{ type: String }],
    sizes: { type: [productSizeSchema], default: [] },
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
        if (ret.salesPrice == null) ret.salesPrice = ret.mrp;
        if (ret.sizes && ret.sizes.length > 0 && typeof ret.sizes[0] === 'string') {
          ret.sizes = ret.sizes.map((name: string) => ({
            name,
            mrp: ret.mrp,
            salesPrice: ret.salesPrice,
          }));
        }
        return ret;
      },
    },
  }
);

productSchema.pre('init', function (doc: any) {
  if (doc.sizes && doc.sizes.length > 0 && typeof doc.sizes[0] === 'string') {
    doc.sizes = doc.sizes.map((name: string) => ({
      name,
      mrp: doc.mrp,
      salesPrice: doc.salesPrice ?? doc.mrp,
    }));
  }
});

productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

// Drop legacy sku unique index if it still exists from a previous schema
mongoose.connection.once('open', () => {
  Product.collection.dropIndex('sku_1').catch(() => {});
});

const Product = mongoose.model<IProductDocument>('Product', productSchema);
export default Product;
