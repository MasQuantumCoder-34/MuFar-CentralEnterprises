import { Response, NextFunction } from 'express';
import InventoryLog from '../models/InventoryLog';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { InventoryAction, ActivityAction } from '@mufar-commerce/shared';
import ActivityLog from '../models/ActivityLog';
import { createNotification } from '../services/notificationService';

const getInventoryLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const productId = req.query.productId as string;
    const action = req.query.action as string;

    const filter: any = {};
    if (productId) filter.product = productId;
    if (action) filter.action = action;

    const total = await InventoryLog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const logs = await InventoryLog.find(filter)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Inventory logs retrieved',
      data: logs,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;

    if (newStock < 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot reduce stock below 0',
        error: 'Bad Request',
      });
      return;
    }

    product.stockQuantity = newStock;
    await product.save();

    const action = quantity >= 0 ? InventoryAction.STOCK_IN : InventoryAction.STOCK_OUT;

    await InventoryLog.create({
      product: product._id,
      action,
      quantity: Math.abs(quantity),
      previousStock,
      newStock,
      performedBy: req.user?._id,
      notes: notes || 'Manual stock adjustment',
    });

    if (newStock <= product.lowStockThreshold) {
      const admins = await require('../models/User').default.find({ role: { $in: ['super_admin', 'admin'] } });
      for (const admin of admins) {
        await createNotification(
          String(admin._id),
          require('@mufar-commerce/shared').NotificationType.LOW_STOCK,
          'Low Stock Alert',
          `Product ${product.name} has low stock: ${newStock} units.`,
          String(product._id),
          'Product'
        );
      }
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.STOCK_ADJUST,
      resource: 'Product',
      resourceId: productId,
      details: `Stock adjusted from ${previousStock} to ${newStock} (${quantity >= 0 ? '+' : ''}${quantity})`,
    });

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        product: {
          _id: product._id,
          name: product.name,
          stockQuantity: product.stockQuantity,
        },
        previousStock,
        newStock,
        adjustment: quantity,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getInventoryLogs, adjustStock };
