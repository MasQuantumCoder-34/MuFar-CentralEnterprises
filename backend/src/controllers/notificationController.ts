import { Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;

    const filter: Record<string, any> = { user: req.user?._id };
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
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user?._id },
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
    await Notification.updateMany(
      { user: req.user?._id, isRead: false },
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
    const count = await Notification.countDocuments({
      user: req.user?._id,
      isRead: false,
    });

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
