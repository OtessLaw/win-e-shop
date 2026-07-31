import { Router } from 'express';
import {
  register, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword, getMe, updateProfile, changePassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { seed } from '../utils/seed';

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

router.get('/seed-db-init', async (_req, res, next) => {
  try {
    await seed();
    res.json({ success: true, message: 'Database successfully seeded with Super Admin credentials!' });
  } catch (err: any) {
    next(err);
  }
});

export default router;
