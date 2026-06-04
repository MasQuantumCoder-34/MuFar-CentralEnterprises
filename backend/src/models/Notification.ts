import mongoose, { Schema, Document } from 'mongoose';
import { INotification, NotificationType } from '@mufar-commerce/shared';

export interface INotificationDocument extends Omit<INotification, '_id' | 'createdAt'>, Document {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    referenceId: { type: String },
    referenceModel: { type: String },
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

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
export default Notification;
