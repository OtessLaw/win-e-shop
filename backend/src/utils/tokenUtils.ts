import jwt from 'jsonwebtoken';
import { Response } from 'express';
import crypto from 'crypto';

const HARDCODED_JWT_SECRET = 'jjvintage_super_secret_jwt_key_2026';
const HARDCODED_JWT_REFRESH_SECRET = 'jjvintage_super_secret_jwt_refresh_key_2026';

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || HARDCODED_JWT_SECRET;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || HARDCODED_JWT_REFRESH_SECRET;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '30d',
  });
};

export const verifyRefreshToken = (token: string): { id: string } => {
  const secret = process.env.JWT_REFRESH_SECRET || HARDCODED_JWT_REFRESH_SECRET;
  return jwt.verify(token, secret) as { id: string };
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookies = (res: Response): void => {
  res.cookie('accessToken', '', { expires: new Date(0) });
  res.cookie('refreshToken', '', { expires: new Date(0) });
};
