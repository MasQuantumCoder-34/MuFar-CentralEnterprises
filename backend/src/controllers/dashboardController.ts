import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Category from '../models/Category';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus } from '@mufar-commerce/shared';

const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalClients,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      lowStockProducts,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments({ role: 'client', isActive: true }),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: OrderStatus.PENDING }),
      Order.countDocuments({ status: OrderStatus.DELIVERED }),
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$stockQuantity', { $ifNull: ['$lowStockThreshold', 10] }] },
      }),
      Order.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      message: 'Admin dashboard data',
      data: {
        totalClients,
        totalProducts,
        totalCategories,
        totalOrders,
        revenue,
        pendingOrders,
        deliveredOrders,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getClientDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientId = req.user?._id;

    const [recentOrders, totalOrders, totalSpent, pendingOrders, deliveredOrders, notifications] = await Promise.all([
      Order.find({ client: clientId }).sort({ createdAt: -1 }).limit(5).populate('items.product', 'name images'),
      Order.countDocuments({ client: clientId }),
      Order.aggregate([
        { $match: { client: clientId as any, status: OrderStatus.DELIVERED } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ client: clientId, status: OrderStatus.PENDING }),
      Order.countDocuments({ client: clientId, status: OrderStatus.DELIVERED }),
      Notification.find({ user: clientId, isRead: false }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      message: 'Client dashboard data',
      data: {
        recentOrders,
        accountSummary: {
          totalOrders,
          totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
          pendingOrders,
          deliveredOrders,
        },
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueTrend = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueTrend = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          deliveredAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' },
          },
          amount: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          amount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Revenue trend',
      data: revenueTrend,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderTrend = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orderTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Order trend',
      data: orderTrend,
    });
  } catch (error) {
    next(error);
  }
};

export { getAdminDashboard, getClientDashboard, getRevenueTrend, getOrderTrend };
