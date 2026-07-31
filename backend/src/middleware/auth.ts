import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

const HARDCODED_JWT_SECRET = 'jjvintage_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Optional authentication middleware — attaches user if valid token exists, but doesn't block
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const secret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
      const decoded = jwt.verify(token, secret) as { id: string };
      const user = await User.findById(decoded.id).populate({
        path: 'role',
        populate: { path: 'permissions' },
      });
      if (user && user.isActive && !user.isSuspended) {
        const roleObj = user.role as unknown as { name: string; permissions: Array<{ name: string }> };
        const permissions = roleObj?.permissions ? roleObj.permissions.map((p) => p.name) : [];
        req.user = {
          id: user._id.toString(),
          role: roleObj?.name || 'customer',
          permissions,
        };
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

/**
 * Verify JWT and attach user to request
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    const secret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (user.isSuspended) {
      return next(new AppError('Your account has been suspended.', 403));
    }

    if (!user.isActive) {
      return next(new AppError('Your account is inactive.', 403));
    }

    const roleObj = user.role as unknown as { name: string; permissions: Array<{ name: string }> };
    const permissions = roleObj?.permissions ? roleObj.permissions.map((p) => p.name) : [];

    req.user = {
      id: user._id.toString(),
      role: roleObj?.name || 'customer',
      permissions,
    };

    next();
  } catch (err) {
    return next(new AppError('Invalid token or session expired. Please log in again.', 401));
  }
};

/**
 * Restrict access by Role (alias requireRole)
 */
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

export const requireRole = (role: string) => restrictTo(role);

/**
 * Restrict access by Permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    const hasPerm = req.user.permissions.includes(permission) || req.user.role === 'super_admin';
    if (!hasPerm) {
      return next(new AppError(`Permission denied. Required: ${permission}`, 403));
    }

    next();
  };
};

/**
 * Super Admin only shortcut
 */
export const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    return next(new AppError('Super Admin access required.', 403));
  }
  next();
};

/**
 * Admin or Manager access
 */
export const adminOrManager = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const allowed = ['super_admin', 'admin', 'store_manager'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return next(new AppError('Admin access required.', 403));
  }
  next();
};
