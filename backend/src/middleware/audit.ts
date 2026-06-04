import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ActivityAction } from '@mufar-commerce/shared';
import ActivityLog from '../models/ActivityLog';

const auditLog = (action: ActivityAction, resource: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await ActivityLog.create({
          user: req.user._id,
          action,
          resource,
          resourceId: req.params.id || req.body._id || undefined,
          details: JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
          }),
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('User-Agent'),
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export = auditLog;
