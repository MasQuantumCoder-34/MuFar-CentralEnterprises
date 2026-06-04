import mongoose, { Schema, Document } from 'mongoose';
import { ISettings } from '@mufar-commerce/shared';

export interface ISettingsDocument extends Omit<ISettings, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    companyName: { type: String, required: true, default: 'Mufar Commerce' },
    logo: { type: String },
    contactNumber: { type: String, required: true, default: '' },
    email: { type: String, required: true, default: '' },
    address: { type: String, required: true, default: '' },
    gstNumber: { type: String },
    invoicePrefix: { type: String, default: 'INV' },
    lowStockThreshold: { type: Number, default: 10 },
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

const Settings = mongoose.model<ISettingsDocument>('Settings', settingsSchema);

export const getSettings = async (): Promise<ISettingsDocument> => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      companyName: 'Mufar Commerce',
      contactNumber: '',
      email: '',
      address: '',
    });
  }
  return settings;
};

export default Settings;
