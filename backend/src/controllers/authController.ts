import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/helpers';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  setTokenCookies,
  clearTokenCookies,
} from '../utils/tokenUtils';
import { sendEmail, emailTemplates } from '../config/email';
import { AuthRequest } from '../middleware/auth';

// ─── Register ───────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return next(new AppError('An account with this email already exists.', 400));

    // Get default customer role
    const customerRole = await Role.findOne({ name: 'customer' });
    if (!customerRole) return next(new AppError('Role configuration error. Please contact support.', 500));

    const verifyToken = generateRandomToken();
    const hashedToken = hashToken(verifyToken);

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: customerRole._id,
      emailVerifyToken: hashedToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify Your Email — JJ Vintage Collection',
      html: emailTemplates.welcomeEmail(name, verifyUrl),
    }).catch(() => {});

    // Issue tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshTokens = [hashToken(refreshToken)];
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    sendSuccess(
      res,
      { user, accessToken, refreshToken },
      'Account created! Please check your email to verify your account.',
      201
    );
  } catch (err) {
    next(err);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase()?.trim() }).select('+password').populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (!user || !user.password) return next(new AppError('Invalid email or password.', 401));
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError('Invalid email or password.', 401));

    if (user.isSuspended) return next(new AppError('Your account has been suspended. Contact support.', 403));
    if (!user.isActive) return next(new AppError('Your account is inactive.', 403));

    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshTokens = [hashToken(refreshToken)];
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);
    sendSuccess(res, { user, accessToken, refreshToken }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { $set: { refreshTokens: [] } });
    }
    clearTokenCookies(res);
    sendSuccess(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return next(new AppError('No refresh token provided.', 401));

    const decoded = verifyRefreshToken(token);
    const hashed = hashToken(token);

    const user = await User.findOne({ _id: decoded.id, refreshTokens: hashed });
    if (!user) return next(new AppError('Invalid refresh token.', 401));

    const accessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());
    user.refreshTokens = [hashToken(newRefreshToken)];
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, newRefreshToken);
    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed.');
  } catch (err) {
    next(new AppError('Invalid or expired refresh token.', 401));
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hashedToken = hashToken(String(req.params.token));
    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Invalid or expired verification link.', 400));

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, null, 'Email verified successfully! You can now log in.');
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase()?.trim() });

    if (!user) {
      sendSuccess(res, null, 'If an account exists with this email, a reset link has been sent.');
      return;
    }

    const resetToken = generateRandomToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset — JJ Vintage Collection',
      html: emailTemplates.passwordReset(user.name, resetUrl),
    }).catch(() => {});

    sendSuccess(res, null, 'Password reset link sent to your email.');
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = hashToken(String(token));
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Password reset token is invalid or has expired.', 400));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendSuccess(res, null, 'Password reset successful. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (!user) return next(new AppError('User not found.', 404));
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { name, phone },
      { new: true, runValidators: true }
    ).populate('role');

    sendSuccess(res, user, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id).select('+password');

    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
};
