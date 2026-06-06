import mongoose, { Schema, Document } from 'mongoose';
import { ICart, ICartItem } from '@mufar-commerce/shared';

export interface ICartDocument extends Omit<ICart, '_id'>, Document {}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String },
    stockQuantity: { type: Number, required: true },
  },
  { _id: false }
);

const cartSchema = new Schema<ICartDocument>(
  {
    client: {
      type: String,
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
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

const Cart = mongoose.model<ICartDocument>('Cart', cartSchema);
export default Cart;
