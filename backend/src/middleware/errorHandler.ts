import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: string;
  name: string;
}

const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let error = 'Server Error';

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    error = 'Validation Error';
    const errors: Record<string, string[]> = {};
    Object.keys(err.errors).forEach((key: string) => {
      errors[key] = [(err.errors as Record<string, { message: string }>)[key].message];
    });
    res.status(statusCode).json({
      success: false,
      message: 'Validation failed',
      error,
      errors,
    });
    return;
  }

  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    error = 'Duplicate Key Error';
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}. This ${field} already exists.`;
  }

  if (err.name === 'CastError' && err.path && err.value) {
    statusCode = 400;
    error = 'Cast Error';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error = 'Invalid Token';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    error = 'Token Expired';
    message = 'Authentication token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

export = errorHandler;
