import { Response, NextFunction } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { ActivityAction } from '@mufar-commerce/shared';
import ActivityLog from '../models/ActivityLog';

const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    const filter: any = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const orderCounts = await Order.aggregate([
      { $match: { client: { $in: users.map((u) => u._id) } } },
      { $group: { _id: '$client', count: { $sum: 1 } } },
    ]);
    const orderCountMap: Record<string, number> = {};
    orderCounts.forEach((o: any) => { orderCountMap[String(o._id)] = o.count; });
    const data = users.map((u) => ({
      ...u.toObject(),
      totalOrders: orderCountMap[String(u._id)] || 0,
    }));

    res.status(200).json({
      success: true,
      message: 'Users retrieved',
      data,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userData = { ...req.body };

    if (!userData.email) {
      delete userData.email;
    } else {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'User with this email already exists', error: 'Conflict' });
        return;
      }
    }

    const user = await User.create({
      ...userData,
      password: userData.password || Math.random().toString(36).slice(2, 10),
    });

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.CREATE,
      resource: 'User',
      resourceId: String(user._id),
      details: `Created user ${user.email}`,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body;

    delete updates.password;
    delete updates.refreshToken;
    delete updates.email;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: 'Not Found' });
      return;
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.UPDATE,
      resource: 'User',
      resourceId: req.params.id,
      details: `Updated user ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: 'Not Found' });
      return;
    }

    await User.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user?._id,
      action: ActivityAction.DELETE,
      resource: 'User',
      resourceId: req.params.id,
      details: `Deleted user ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'User deleted permanently',
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: 'Not Found' });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: user.isActive ? ActivityAction.UPDATE : ActivityAction.DELETE,
      resource: 'User',
      resourceId: req.params.id,
      details: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export { getUsers, createUser, getUserById, updateUser, deleteUser, toggleUserStatus };
