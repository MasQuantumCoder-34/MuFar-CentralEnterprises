import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus } from '@mufar-commerce/shared';

const getSalesReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, type = 'daily' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate as string) : new Date();

    let dateFormat: string;
    if (type === 'daily') dateFormat = '%Y-%m-%d';
    else if (type === 'weekly') dateFormat = '%Y-W%V';
    else if (type === 'monthly') dateFormat = '%Y-%m';
    else dateFormat = '%Y';

    const salesData = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          deliveredAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$deliveredAt' } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalDiscount: { $sum: '$discount' },
          totalTax: { $sum: '$tax' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          totalOrders: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalDiscount: { $round: ['$totalDiscount', 2] },
          totalTax: { $round: ['$totalTax', 2] },
        },
      },
    ]);

    const summary = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          deliveredAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Sales report',
      data: {
        summary: summary[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
        breakdown: salesData,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [lowStockProducts, outOfStockProducts, totalProducts] = await Promise.all([
      Product.find({
        isActive: true,
        stockQuantity: { $gt: 0 },
        $expr: { $lte: ['$stockQuantity', { $ifNull: ['$lowStockThreshold', 10] }] },
      })
        .populate('category', 'name')
        .sort({ stockQuantity: 1 }),
      Product.find({ isActive: true, stockQuantity: 0 })
        .populate('category', 'name')
        .sort({ name: 1 }),
      Product.countDocuments({ isActive: true }),
    ]);

    const totalStockValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Inventory report',
      data: {
        summary: {
          totalProducts,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          totalStockValue: totalStockValue[0]?.totalValue || 0,
        },
        lowStockProducts,
        outOfStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topCustomers = await Order.aggregate([
      { $match: { status: OrderStatus.DELIVERED } },
      {
        $group: {
          _id: '$client',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'clientInfo',
        },
      },
      { $unwind: '$clientInfo' },
      {
        $project: {
          _id: 0,
          clientId: '$_id',
          storeName: '$clientInfo.storeName',
          ownerName: '$clientInfo.ownerName',
          email: '$clientInfo.email',
          mobile: '$clientInfo.mobile',
          totalOrders: 1,
          totalSpent: { $round: ['$totalSpent', 2] },
          lastOrderDate: 1,
        },
      },
    ]);

    const totalClients = await User.countDocuments({ role: 'client' });

    res.status(200).json({
      success: true,
      message: 'Customer report',
      data: {
        totalClients,
        topCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'sales', format = 'csv', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate as string) : new Date();

    let data: any[] = [];

    if (type === 'sales') {
      data = await Order.aggregate([
        {
          $match: {
            status: OrderStatus.DELIVERED,
            deliveredAt: { $gte: start, $lte: end },
          },
        },
        { $sort: { deliveredAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'client',
            foreignField: '_id',
            as: 'clientInfo',
          },
        },
        { $unwind: { path: '$clientInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            orderNumber: 1,
            invoiceNumber: 1,
            clientName: { $ifNull: ['$clientInfo.storeName', '$clientInfo.ownerName', 'N/A'] },
            status: 1,
            subtotal: 1,
            tax: 1,
            discount: 1,
            total: 1,
            deliveredAt: 1,
          },
        },
      ]);
    }

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row) =>
        Object.values(row)
          .map((val) => (val ? `"${String(val)}"` : ''))
          .join(',')
      );
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(200).json({
        success: true,
        message: 'Report data',
        data,
      });
    }
  } catch (error) {
    next(error);
  }
};

export { getSalesReport, getInventoryReport, getCustomerReport, exportReport };
