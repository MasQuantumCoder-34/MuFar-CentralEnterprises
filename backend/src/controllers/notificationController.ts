import { Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '@mufar-commerce/shared';

const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;

    const isAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.MANAGER;

    const filter: Record<string, any> = {};
    if (!isAdmin) filter.user = req.user?._id;
    if (type) filter.type = type;

    const total = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: notifications,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.MANAGER;
    const filter: Record<string, any> = { _id: req.params.id };
    if (!isAdmin) filter.user = req.user?._id;

    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.MANAGER;
    const filter: Record<string, any> = { isRead: false };
    if (!isAdmin) filter.user = req.user?._id;

    await Notification.updateMany(
      filter,
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.MANAGER;
    const filter: Record<string, any> = { isRead: false };
    if (!isAdmin) filter.user = req.user?._id;

    const count = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
