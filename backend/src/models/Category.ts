import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from '@mufar-commerce/shared';

export interface ICategoryDocument extends Omit<ICategory, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
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

categorySchema.pre<ICategoryDocument>('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });

const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);
export default Category;
