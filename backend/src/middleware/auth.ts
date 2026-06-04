import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config/index';
import { IJwtPayload } from '@mufar-commerce/shared';
import { UserRole } from '@mufar-commerce/shared';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    id: string;
    email: string;
    role: UserRole;
    storeName?: string;
  };
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: 'No authentication token provided',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as IJwtPayload;

    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists',
        error: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
        error: 'Account deactivated',
      });
      return;
    }

    if (user.isLocked) {
      res.status(401).json({
        success: false,
        message: 'Account is locked. Please contact support.',
        error: 'Account locked',
      });
      return;
    }

    req.user = {
      _id: String(user._id),
      id: String(user._id),
      email: user.email,
      role: user.role as UserRole,
      storeName: user.storeName,
    };
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'JsonWebTokenError',
      });
      return;
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TokenExpiredError',
      });
      return;
    }
    next(error);
  }
};

const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role ${req.user?.role} is not authorized to access this route`,
        error: 'Forbidden',
      });
      return;
    }
    next();
  };
};

export { protect, authorize };
