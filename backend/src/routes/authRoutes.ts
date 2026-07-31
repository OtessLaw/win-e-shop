import { Router } from 'express';
import {
  register, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword, getMe, updateProfile, changePassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { seed } from '../utils/seed';
import { seedTestProducts } from '../utils/seedTestProducts';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.patch('/update-profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

// Seed admin + roles
router.get('/seed-db-init', async (_req, res, next) => {
  try {
    await seed();
    res.json({ success: true, message: 'Database successfully seeded with Super Admin credentials!' });
  } catch (err: any) {
    next(err);
  }
});

// Seed test products with low GH₵1–3 prices
router.get('/seed-test-products', async (_req, res, next) => {
  try {
    await seedTestProducts();
    res.json({ success: true, message: '16 test products seeded with GH₵1-3 prices! Refresh your shop to see them.' });
  } catch (err: any) {
    next(err);
  }
});

export default router;

