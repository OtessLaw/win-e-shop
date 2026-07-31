import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Role, Permission } from '../models/Role';
import connectDB from '../config/database';

dotenv.config();

const PERMISSIONS = [
  { name: 'products:view', label: 'View Products', group: 'Products' },
  { name: 'products:create', label: 'Create Products', group: 'Products' },
  { name: 'products:edit', label: 'Edit Products', group: 'Products' },
  { name: 'products:delete', label: 'Delete Products', group: 'Products' },
  { name: 'orders:view', label: 'View Orders', group: 'Orders' },
  { name: 'orders:edit', label: 'Edit/Update Orders', group: 'Orders' },
  { name: 'orders:delete', label: 'Delete Orders', group: 'Orders' },
  { name: 'customers:view', label: 'View Customers', group: 'Customers' },
  { name: 'customers:edit', label: 'Edit Customers', group: 'Customers' },
  { name: 'customers:suspend', label: 'Suspend Customers', group: 'Customers' },
  { name: 'analytics:view', label: 'View Analytics', group: 'Analytics' },
  { name: 'banners:manage', label: 'Manage Banners', group: 'Content' },
  { name: 'coupons:manage', label: 'Manage Coupons', group: 'Marketing' },
  { name: 'content:manage', label: 'Manage CMS Content', group: 'Content' },
  { name: 'roles:manage', label: 'Manage Roles', group: 'System' },
  { name: 'logs:view', label: 'View Audit Logs', group: 'System' },
  { name: 'reviews:manage', label: 'Manage Reviews', group: 'Products' },
  { name: 'faqs:manage', label: 'Manage FAQs', group: 'Content' },
  { name: 'settings:manage', label: 'Manage Store Settings', group: 'System' },
];

const ROLES = [
  {
    name: 'super_admin',
    label: 'Super Administrator',
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'admin',
    label: 'Administrator',
    isSystem: true,
    permissions: PERMISSIONS.filter((p) => p.name !== 'roles:manage').map((p) => p.name),
  },
  {
    name: 'product_manager',
    label: 'Product Manager',
    isSystem: false,
    permissions: ['products:view', 'products:create', 'products:edit', 'products:delete', 'reviews:manage'],
  },
  {
    name: 'order_manager',
    label: 'Order Manager',
    isSystem: false,
    permissions: ['orders:view', 'orders:edit', 'customers:view'],
  },
  {
    name: 'customer_support',
    label: 'Customer Support',
    isSystem: false,
    permissions: ['orders:view', 'customers:view', 'reviews:manage', 'faqs:manage'],
  },
  {
    name: 'marketing_manager',
    label: 'Marketing Manager',
    isSystem: false,
    permissions: ['banners:manage', 'coupons:manage', 'content:manage', 'analytics:view'],
  },
  {
    name: 'accountant',
    label: 'Accountant',
    isSystem: false,
    permissions: ['orders:view', 'analytics:view'],
  },
  {
    name: 'customer',
    label: 'Customer',
    isSystem: true,
    permissions: [],
  },
];

const CATEGORIES = [
  { name: 'Men', slug: 'men', description: "Men's Clothing and Shoes", isActive: true },
  { name: 'Women', slug: 'women', description: "Women's Fashion", isActive: true },
  { name: 'Shoes', slug: 'shoes', description: 'Footwear Collection', isActive: true },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, Watches, and Jewelry', isActive: true },
];

export const seed = async (): Promise<void> => {
  try {
    await connectDB();

    console.log('🌱 Seeding permissions...');
    const permMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const perm of PERMISSIONS) {
      const doc = await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, returnDocument: 'after' }
      );
      permMap[perm.name] = doc._id as mongoose.Types.ObjectId;
    }
    console.log(`  ✅ ${Object.keys(permMap).length} permissions seeded`);

    console.log('🌱 Seeding roles...');
    const roleMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const roleData of ROLES) {
      const permIds = roleData.permissions.map((p) => permMap[p]).filter(Boolean);
      const role = await Role.findOneAndUpdate(
        { name: roleData.name },
        { name: roleData.name, label: roleData.label, isSystem: roleData.isSystem, permissions: permIds },
        { upsert: true, returnDocument: 'after' }
      );
      roleMap[roleData.name] = role._id as mongoose.Types.ObjectId;
    }
    console.log(`  ✅ ${ROLES.length} roles seeded`);

    console.log('🌱 Seeding Super Admin...');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jjvintage.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: process.env.ADMIN_NAME || 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: roleMap['super_admin'],
        isEmailVerified: true,
        isActive: true,
        isSuspended: false,
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  ✅ Super Admin seeded/reset: ${adminEmail}`);

    console.log('🌱 Seeding categories...');
    const Category = (await import('../models/Category')).Category;
    for (const cat of CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`  ✅ ${CATEGORIES.length} categories seeded`);

    console.log('\n🎉 Seeding complete!\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
};

if (require.main === module) {
  seed();
}
