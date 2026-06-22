import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import InventoryLog from '../models/InventoryLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import {
  OrderStatus,
  ORDER_STATUS_FLOW,
  ActivityAction,
  InventoryAction,
  NotificationType,
} from '@mufar-commerce/shared';
import { createNotification } from '../services/notificationService';
import { generateInvoicePDF } from '../services/pdfService';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/generators';
import { getSizePrice } from '../utils/helpers';
import ActivityLog from '../models/ActivityLog';
import Settings from '../models/Settings';

const getOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const clientId = req.query.clientId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const search = req.query.search as string;

    const filter: any = {};

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) filter.status = statuses[0];
      else if (statuses.length > 1) filter.status = { $in: statuses };
    }
    if (clientId) filter.client = clientId;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sortField = req.query.sort as string || '-createdAt';
    let sortObj: any = { createdAt: -1 };
    if (sortField.startsWith('-')) {
      sortObj = { [sortField.slice(1)]: -1 };
    } else {
      sortObj = { [sortField]: 1 };
    }

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const orders = await Order.find(filter)
      .populate('client', 'storeName ownerName email mobile')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved',
      data: orders,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { deliveryAddress, contactNumber, notes, items, clientId } = req.body;

    const client = clientId || req.user?._id;

    const user = await User.findById(client);
    if (!user) {
      res.status(404).json({ success: false, message: 'Client not found', error: 'Not Found' });
      return;
    }

    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
          error: 'Not Found',
        });
        return;
      }

      if (!product.isActive) {
        res.status(400).json({
          success: false,
          message: `Product ${product.name} is not active`,
          error: 'Bad Request',
        });
        return;
      }

      if (product.stockQuantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
          error: 'Bad Request',
        });
        return;
      }

      const { salesPrice: itemPrice } = getSizePrice(product, item.size);
      const total = itemPrice * item.quantity;
      subtotal += total;

      orderItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: itemPrice,
        total,
        size: item.size || undefined,
      });
    }

    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();

    const order = await Order.create({
      orderNumber,
      invoiceNumber,
      client: clientId,
      items: orderItems,
      deliveryAddress,
      contactNumber,
      notes,
      status: OrderStatus.PENDING,
      subtotal,
      tax: 0,
      total: subtotal,
      timeline: [
        {
          status: OrderStatus.PENDING,
          note: 'Order placed',
          timestamp: new Date(),
          updatedBy: req.user?._id,
        },
      ],
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('client', 'storeName ownerName email mobile')
      .populate('items.product', 'name images');

    await createNotification(
      (client as string).toString(),
      NotificationType.NEW_ORDER,
      'Order Placed',
      `Order ${orderNumber} has been placed successfully.`,
      String(order._id),
      'Order'
    );

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.CREATE,
      resource: 'Order',
      resourceId: String(order._id),
      details: `Order ${orderNumber} created`,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'storeName ownerName email mobile address city state pincode')
      .populate('items.product', 'name images sku')
      .populate('timeline.updatedBy', 'name email role');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', error: 'Not Found' });
      return;
    }

    const allowedTransitions = ORDER_STATUS_FLOW[order.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`,
        error: 'Bad Request',
      });
      return;
    }

    const previousStatus = order.status;
    order.status = status as OrderStatus;

    if (status === OrderStatus.PROCESSING && previousStatus === OrderStatus.PENDING) {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const oldStock = product.stockQuantity;
          product.stockQuantity -= item.quantity;
          product.salesCount += item.quantity;
          await product.save();

          await InventoryLog.create({
            product: product._id,
            action: InventoryAction.ORDER_DEDUCTION,
            quantity: item.quantity,
            previousStock: oldStock,
            newStock: product.stockQuantity,
            referenceId: String(order._id),
            referenceModel: 'Order',
            performedBy: req.user?._id,
            notes: `Stock deducted for Order ${order.orderNumber}`,
          });
        }
      }
    }

    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date().toISOString();
    }

    if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date().toISOString();
      order.cancellationReason = notes;
      if (previousStatus === OrderStatus.PROCESSING || previousStatus === OrderStatus.PENDING) {
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            const oldStock = product.stockQuantity;
            product.stockQuantity += item.quantity;
            await product.save();

            await InventoryLog.create({
              product: product._id,
              action: InventoryAction.STOCK_IN,
              quantity: item.quantity,
              previousStock: oldStock,
              newStock: product.stockQuantity,
              referenceId: String(order._id),
              referenceModel: 'Order',
              performedBy: req.user?._id,
              notes: `Stock restored for cancelled Order ${order.orderNumber}`,
            });
          }
        }
      }
    }

    order.timeline.push({
      status: status as OrderStatus,
      note: notes || `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
      updatedBy: String(req.user!._id),
    });

    await order.save();

    const notificationTypeMap: Record<string, NotificationType> = {
      [OrderStatus.PROCESSING]: NotificationType.ORDER_PROCESSING,
      [OrderStatus.OUT_FOR_DELIVERY]: NotificationType.ORDER_OUT_FOR_DELIVERY,
      [OrderStatus.DELIVERED]: NotificationType.ORDER_DELIVERED,
      [OrderStatus.CANCELLED]: NotificationType.ORDER_CANCELLED,
    };

    const notifType = notificationTypeMap[status];
    if (notifType) {
      await createNotification(
        (order.client as string).toString(),
        notifType,
        `Order ${status.replace(/_/g, ' ').toUpperCase()}`,
        `Order ${order.orderNumber} status updated to ${status.replace(/_/g, ' ')}.`,
        String(order._id),
        'Order'
      );
    }

    const actionMap: Record<string, ActivityAction> = {
      [OrderStatus.DELIVERED]: ActivityAction.DELIVER,
    };

    await ActivityLog.create({
      user: req.user?._id,
      action: actionMap[status] || ActivityAction.UPDATE,
      resource: 'Order',
      resourceId: req.params.id,
      details: `Order ${order.orderNumber} status changed from ${previousStatus} to ${status}`,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('client', 'storeName ownerName email mobile')
      .populate('items.product', 'name images')
      .populate('timeline.updatedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, notes } = req.body;
    let skipped: string[] = [];

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', error: 'Not Found' });
      return;
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: `${order.status === OrderStatus.DELIVERED ? 'Delivered' : 'Cancelled'} orders cannot be modified`,
        error: 'Bad Request',
      });
      return;
    }

    if (order.status === OrderStatus.PROCESSING && items) {
      for (const oldItem of order.items) {
        const product = await Product.findById(oldItem.product);
        if (product) {
          product.stockQuantity += oldItem.quantity;
          product.salesCount -= oldItem.quantity;
          await product.save();
        }
      }
    }

    if (items) {
      const orderItems: any[] = [];
      let subtotal = 0;
      skipped = [];

      for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product) {
          skipped.push(`${item.product} (deleted)`);
          continue;
        }

        if (!product.isActive) {
          skipped.push(`${product.name} (inactive)`);
          continue;
        }

        if (product.stockQuantity < item.quantity) {
          skipped.push(`${product.name} (insufficient stock)`);
          continue;
        }

        const { salesPrice: itemPrice } = getSizePrice(product, item.size);
        const total = itemPrice * item.quantity;
        subtotal += total;

        orderItems.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price: itemPrice,
          total,
          size: item.size || undefined,
        });
      }

      if (skipped.length > 0) {
        console.warn(`Update order ${order.orderNumber}: skipped items - ${skipped.join(', ')}`);
      }

      if (order.status === OrderStatus.PROCESSING) {
        for (const newItem of orderItems) {
          const product = await Product.findById(newItem.product);
          if (product) {
            product.stockQuantity -= newItem.quantity;
            product.salesCount += newItem.quantity;
            await product.save();
          }
        }
      }

      order.items = orderItems as any;
      order.subtotal = subtotal;
      order.tax = 0;
      order.total = subtotal;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    order.timeline.push({
      status: order.status,
      note: 'Order modified',
      timestamp: new Date().toISOString(),
      updatedBy: String(req.user!._id),
    });

    await order.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.UPDATE,
      resource: 'Order',
      resourceId: req.params.id,
      details: `Order ${order.orderNumber} modified`,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('client', 'storeName ownerName email mobile')
      .populate('items.product', 'name images');

    const skippedMsg = skipped.length > 0 ? ` ${skipped.length} item(s) skipped (no longer available).` : '';
    res.status(200).json({
      success: true,
      message: 'Order updated successfully' + skippedMsg,
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = { client: req.user?._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'My orders retrieved',
      data: orders,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const getOrderInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'storeName ownerName email mobile address city state pincode');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', error: 'Not Found' });
      return;
    }

    const { getSettings } = require('../models/Settings');
    const settingsDoc = await getSettings();

    const company = {
      companyName: settingsDoc.companyName,
      logo: settingsDoc.logo,
      contactNumber: settingsDoc.contactNumber,
      email: settingsDoc.email,
      address: settingsDoc.address,
      gstNumber: settingsDoc.gstNumber,
      invoicePrefix: settingsDoc.invoicePrefix,
      lowStockThreshold: settingsDoc.lowStockThreshold,
    };

    const pdfBuffer = await generateInvoicePDF(order.toObject() as any, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const getOrderTracking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('timeline.updatedBy', 'name email role');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order tracking retrieved',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        timeline: order.timeline,
        expectedDeliveryDate: order.expectedDeliveryDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', error: 'Not Found' });
      return;
    }

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in ${order.status} status`,
        error: 'Bad Request',
      });
      return;
    }

    const orderPrevStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date().toISOString();
    order.cancellationReason = reason || 'Cancelled';

    order.timeline.push({
      status: OrderStatus.CANCELLED,
      note: reason || 'Cancelled',
      timestamp: new Date().toISOString(),
      updatedBy: String(req.user!._id),
    });

    if (orderPrevStatus === OrderStatus.PROCESSING || orderPrevStatus === OrderStatus.PENDING) {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const oldStock = product.stockQuantity;
          product.stockQuantity += item.quantity;
          await product.save();

          await InventoryLog.create({
            product: product._id,
            action: InventoryAction.STOCK_IN,
            quantity: item.quantity,
            previousStock: oldStock,
            newStock: product.stockQuantity,
            referenceId: String(order._id),
            referenceModel: 'Order',
            performedBy: req.user?._id,
            notes: `Stock restored for cancelled Order ${order.orderNumber}`,
          });
        }
      }
    }

    await order.save();

    await createNotification(
      (order.client as string).toString(),
      NotificationType.ORDER_CANCELLED,
      'Order Cancelled',
      `Order ${order.orderNumber} has been cancelled.`,
      String(order._id),
      'Order'
    );

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  getMyOrders,
  getOrderInvoice,
  getOrderTracking,
  cancelOrder,
};
