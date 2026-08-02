import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../utils/AppError';

const handleCastError = (err: { path: string; value: unknown }) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err: { keyValue: Record<string, unknown> }) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`Duplicate value for field '${field}': ${value}. Please use a different value.`, 400);
};

const handleValidationError = (err: { errors: Record<string, { message: string }> }) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation error: ${errors.join('. ')}`, 400);
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose errors
  if (typeof err === 'object' && err !== null) {
    const mongoErr = err as Record<string, unknown>;
    if (mongoErr.name === 'CastError') {
      const appErr = handleCastError(mongoErr as { path: string; value: unknown });
      res.status(appErr.statusCode).json({ success: false, message: appErr.message });
      return;
    }
    if (mongoErr.code === 11000) {
      const appErr = handleDuplicateKey(mongoErr as { keyValue: Record<string, unknown> });
      res.status(appErr.statusCode).json({ success: false, message: appErr.message });
      return;
    }
    if (mongoErr.name === 'ValidationError') {
      const appErr = handleValidationError(mongoErr as { errors: Record<string, { message: string }> });
      res.status(appErr.statusCode).json({ success: false, message: appErr.message });
      return;
    }
    if (mongoErr.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid token.' });
      return;
    }
    if (mongoErr.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expired.' });
      return;
    }
  }

  // Unknown errors — don't leak details in production
  console.error('UNHANDLED ERROR:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: isDev ? String(err) : 'Internal server error. Please try again later.',
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
