import { Response } from 'express';

interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginatedSuccess = <T>(
  res: Response,
  result: PaginationResult<T>,
  message = 'Success'
): void => {
  res.status(200).json({
    success: true,
    message,
    data: result.data,
    pagination: result.pagination,
  });
};

export const getPaginationParams = (
  query: Record<string, unknown>
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => ({
  data,
  pagination: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  },
});

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generateOrderNumber = async (): Promise<string> => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `JJV-${timestamp}`;
};
