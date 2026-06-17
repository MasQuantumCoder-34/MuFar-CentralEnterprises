import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import config from './config/index';
import connectDB from './config/database';
import routes from './routes/index';
import errorHandler from './middleware/errorHandler';
import User from './models/User';
import Settings from './models/Settings';
import { RATE_LIMIT } from '@mufar-commerce/shared';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'Rate limit exceeded',
  },
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later',
    error: 'Rate limit exceeded',
  },
});

app.use(limiter);
app.use('/api/auth/login', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(express.static('public'));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mufar Commerce API is running',
    data: {
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'Not Found',
  });
});

app.use(errorHandler);

const cleanupIndexes = async (): Promise<void> => {
  try {
    await User.collection.dropIndex('email_1');
    console.log('Dropped legacy email unique index');
  } catch {
    // index already gone or never existed
  }
};

const autoSeed = async (): Promise<void> => {
  const adminExists = await User.findOne({ email: 'admin@mufar.com' });
  if (!adminExists) {
    await User.create({
      storeName: 'Mufar Technologies',
      ownerName: 'Super Admin',
      name: 'Super Admin',
      email: 'admin@mufar.com',
      mobile: '9999999999',
      password: 'Admin@123',
      role: 'super_admin',
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
    });
    console.log('Auto-seed: super admin created (admin@mufar.com / Admin@123)');
  }

  const settingsExist = await Settings.findOne();
  if (!settingsExist) {
    await Settings.create({
      companyName: 'Mufar Commerce',
      contactNumber: '9999999999',
      email: 'admin@mufar.com',
      address: 'Mufar Technologies HQ',
      gstNumber: 'GSTIN123456',
      invoicePrefix: 'INV',
      lowStockThreshold: 10,
    });
    console.log('Auto-seed: default settings created');
  }
};

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await cleanupIndexes();
    await autoSeed();
    app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`API available at http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export = app;
