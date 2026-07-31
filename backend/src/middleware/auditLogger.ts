import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/Misc';
import { AuthRequest } from './auth';

export const auditLogger = (action: string, resource: string) =>
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await AuditLog.create({
        user: req.user?.id,
        action,
        resource,
        resourceId: req.params?.id ? String(req.params.id) : undefined,
        details: { body: req.body, query: req.query },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    } catch {
      // Non-blocking: audit log failure should not break the request
    }
    next();
  };

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
};
