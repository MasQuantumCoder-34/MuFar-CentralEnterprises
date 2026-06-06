import { Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import InventoryLog from '../models/InventoryLog';
import { AuthRequest } from '../middleware/auth';
import { ActivityAction, InventoryAction } from '@mufar-commerce/shared';
import ActivityLog from '../models/ActivityLog';
import { uploadToCloudinary } from '../middleware/upload';

const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    const isActive = req.query.isActive as string;

    const filter: any = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Products retrieved',
      data: products,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body.sku) {
      const timestamp = Date.now().toString(36).toUpperCase();
      req.body.sku = `PROD-${timestamp}`;
    }

    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      res.status(400).json({ success: false, message: 'Category not found', error: 'Bad Request' });
      return;
    }

    const product = await Product.create(req.body);

    await InventoryLog.create({
      product: product._id,
      action: InventoryAction.STOCK_IN,
      quantity: product.stockQuantity,
      previousStock: 0,
      newStock: product.stockQuantity,
      performedBy: req.user?._id,
      notes: 'Initial stock on product creation',
    });

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.CREATE,
      resource: 'Product',
      resourceId: String(product._id),
      details: `Created product ${product.name}`,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug description');

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    const oldStock = product.stockQuantity;

    Object.assign(product, req.body);
    await product.save();

    if (req.body.stockQuantity !== undefined && req.body.stockQuantity !== oldStock) {
      const diff = req.body.stockQuantity - oldStock;
      await InventoryLog.create({
        product: product._id,
        action: diff > 0 ? InventoryAction.STOCK_IN : InventoryAction.STOCK_OUT,
        quantity: Math.abs(diff),
        previousStock: oldStock,
        newStock: product.stockQuantity,
        performedBy: req.user?._id,
        notes: 'Stock adjustment on product update',
      });
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.UPDATE,
      resource: 'Product',
      resourceId: req.params.id,
      details: `Updated product ${product.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    await Product.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.DELETE,
      resource: 'Product',
      resourceId: req.params.id,
      details: `Deleted product ${product.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const toggleProductStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    product.isActive = !product.isActive;
    await product.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: product.isActive ? ActivityAction.UPDATE : ActivityAction.DELETE,
      resource: 'Product',
      resourceId: req.params.id,
      details: `${product.isActive ? 'Activated' : 'Deactivated'} product ${product.name}`,
    });

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const uploadProductImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ success: false, message: 'No images uploaded', error: 'Bad Request' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const uploadPromises = files.map((file) => uploadToCloudinary(file, 'mufar-commerce/products'));
    const results = await Promise.all(uploadPromises);

    const imageUrls = results.map((result) => result.secure_url);
    product.images = [...product.images, ...imageUrls];
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({
      isActive: true,
      stockQuantity: { $lte: { $expr: { $ifNull: ['$lowStockThreshold', 10] } } },
    })
      .populate('category', 'name')
      .sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      message: 'Low stock products retrieved',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      res.status(400).json({ success: false, message: 'Search query is required', error: 'Bad Request' });
      return;
    }

    const filter: any = {
      isActive: true,
      name: { $regex: query, $options: 'i' },
    };

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ salesCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Search results',
      data: products,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

export {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  uploadProductImages,
  getLowStockProducts,
  searchProducts,
};
