import { Response, NextFunction } from 'express';
import Category from '../models/Category';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { ActivityAction } from '@mufar-commerce/shared';
import ActivityLog from '../models/ActivityLog';

const getCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find().populate('parent', 'name slug').sort({ sortOrder: 1, name: 1 });
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    productCounts.forEach((p: any) => { countMap[String(p._id)] = p.count; });
    const data = categories.map((c) => ({
      ...c.toObject(),
      productCount: countMap[String(c._id)] || 0,
    }));

    res.status(200).json({
      success: true,
      message: 'Categories retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = { ...req.body };
    if (!body.parent || body.parent === 'none' || body.parent === 'null') {
      delete body.parent;
    }
    const category = await Category.create(body);

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.CREATE,
      resource: 'Category',
      resourceId: String(category._id),
      details: `Created category ${category.name}`,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = { ...req.body };
    if (body.parent === 'none' || body.parent === 'null') {
      body.parent = null;
    }
    const category = await Category.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).populate('parent', 'name slug');

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found', error: 'Not Found' });
      return;
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.UPDATE,
      resource: 'Category',
      resourceId: req.params.id,
      details: `Updated category ${category.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found', error: 'Not Found' });
      return;
    }

    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productsCount} product(s) are associated with it.`,
        error: 'Bad Request',
      });
      return;
    }

    const subcategoriesCount = await Category.countDocuments({ parent: req.params.id });
    if (subcategoriesCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. ${subcategoriesCount} subcategory(ies) exist under it.`,
        error: 'Bad Request',
      });
      return;
    }

    await Category.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.DELETE,
      resource: 'Category',
      resourceId: req.params.id,
      details: `Deleted category ${category.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryTree = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buildTree = async (parentId: string | null = null): Promise<any[]> => {
      const categories = await Category.find({ parent: parentId }).sort({ sortOrder: 1, name: 1 });

      const tree = [];
      for (const cat of categories) {
        const children = await buildTree(String(cat._id));
        tree.push({
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          isActive: cat.isActive,
          sortOrder: cat.sortOrder,
          children,
        });
      }
      return tree;
    };

    const tree = await buildTree(null);

    res.status(200).json({
      success: true,
      message: 'Category tree retrieved',
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

export { getCategories, createCategory, getCategoryById, updateCategory, deleteCategory, getCategoryTree };
