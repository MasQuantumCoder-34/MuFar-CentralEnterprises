import { Response, NextFunction } from 'express';
import Settings, { getSettings } from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';
import { ActivityAction } from '@mufar-commerce/shared';
import ActivityLog from '../models/ActivityLog';

const getSettingsController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getSettings();

    res.status(200).json({
      success: true,
      message: 'Settings retrieved',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.UPDATE,
      resource: 'Settings',
      details: 'Updated system settings',
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const uploadLogo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image uploaded', error: 'Bad Request' });
      return;
    }

    const result = await uploadToCloudinary(req.file, 'mufar-commerce/settings');

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ logo: result.secure_url });
    } else {
      settings.logo = result.secure_url;
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export { getSettingsController, updateSettings, uploadLogo };
