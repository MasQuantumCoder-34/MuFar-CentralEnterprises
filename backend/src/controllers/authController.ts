import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config/index';
import { AuthRequest } from '../middleware/auth';
import { ACCOUNT_LOCK, JWT, IJwtPayload, UserRole, ActivityAction } from '@mufar-commerce/shared';
import { sendPasswordReset } from '../services/emailService';
import ActivityLog from '../models/ActivityLog';

const createTokenPair = (payload: IJwtPayload) => {
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessExpiry as any });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiry as any });
  return { accessToken, refreshToken };
};

const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password', error: 'Unauthorized' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ success: false, message: 'Account has been deactivated', error: 'Account deactivated' });
      return;
    }

    if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${minutesLeft} minutes`,
        error: 'Account locked',
      });
      return;
    }

    if (user.isLocked && user.lockUntil && user.lockUntil <= new Date()) {
      user.isLocked = false;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= ACCOUNT_LOCK.MAX_LOGIN_ATTEMPTS) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + ACCOUNT_LOCK.LOCK_DURATION_MINUTES * 60 * 1000);
      }
      await user.save();

      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
      return;
    }

    user.loginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const payload: IJwtPayload = {
      userId: String(user._id),
      role: user.role as UserRole,
      email: user.email!,
    };

    const { accessToken, refreshToken } = createTokenPair(payload);

    user.refreshToken = refreshToken;
    await user.save();

    await ActivityLog.create({
      user: user._id,
      action: ActivityAction.LOGIN,
      resource: 'User',
      resourceId: String(user._id),
      details: 'User logged in',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          storeName: user.storeName,
          ownerName: user.ownerName,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required', error: 'Bad Request' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtRefreshSecret) as IJwtPayload;

    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ success: false, message: 'Invalid refresh token', error: 'Unauthorized' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ success: false, message: 'Account deactivated', error: 'Forbidden' });
      return;
    }

    const payload: IJwtPayload = {
      userId: String(user._id),
      role: user.role as UserRole,
      email: user.email!,
    };

    const { accessToken, refreshToken } = createTokenPair(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken, refreshToken },
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token', error: 'Unauthorized' });
      return;
    }
    next(error);
  }
};

const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

      await ActivityLog.create({
        user: req.user._id,
        action: ActivityAction.LOGOUT,
        resource: 'User',
        resourceId: req.user._id,
        details: 'User logged out',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
    }

    res.clearCookie('accessToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: 'Not Found' });
      return;
    }

    if (!user.mustChangePassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect', error: 'Bad Request' });
        return;
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });
      return;
    }

    const resetToken = jwt.sign(
      { userId: String(user._id) },
      config.jwtSecret,
      { expiresIn: config.jwtResetExpiry as any }
    );

    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    await sendPasswordReset(email, resetLink);

    res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required', error: 'Bad Request' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token', error: 'Bad Request' });
      return;
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(400).json({ success: false, message: 'Reset token has expired', error: 'Bad Request' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(400).json({ success: false, message: 'Invalid reset token', error: 'Bad Request' });
      return;
    }
    next(error);
  }
};

const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', error: 'Not Found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export { login, refresh, logout, changePassword, forgotPassword, resetPassword, getMe };
