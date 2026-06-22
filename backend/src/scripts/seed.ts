import mongoose from 'mongoose';
import User from '../models/User';
import Settings from '../models/Settings';
import config from '../config';

async function seed() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@mufar.com' });
    if (!adminExists) {
      await User.create({
        storeName: 'Central Enterprises',
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
      console.log('Super admin created: admin@mufar.com / Admin@123');
    } else {
      console.log('Admin already exists');
    }

    const settingsExist = await Settings.findOne();
    if (!settingsExist) {
      await Settings.create({
        companyName: 'Central Enterprises',
        contactNumber: '9999999999',
        email: 'admin@mufar.com',
        address: 'Central Enterprises HQ',
        gstNumber: 'GSTIN123456',
        invoicePrefix: 'INV',
        lowStockThreshold: 10,
      });
      console.log('Default settings created');
    } else {
      console.log('Settings already exist');
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
