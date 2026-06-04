import mongoose, { Schema, Document } from 'mongoose';
import { IActivityLog, ActivityAction } from '@mufar-commerce/shared';

export interface IActivityLogDocument extends Omit<IActivityLog, '_id' | 'createdAt'>, Document {}

const activityLogSchema = new Schema<IActivityLogDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: Object.values(ActivityAction),
      required: true,
    },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
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

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLogDocument>('ActivityLog', activityLogSchema);
export default ActivityLog;
