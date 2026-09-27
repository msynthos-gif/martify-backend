import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // 1. AppError (Custom Operational Errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // 2. Multer Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size exceeds the 5MB limit',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
    return;
  }

  // 3. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => {
      const fieldPath = e.path.join('.').replace(/^(body|query|params)\./, '');
      return {
        field: fieldPath || 'general',
        message: e.message,
      };
    });
    const summary = formattedErrors.map((fe) => `${fe.field}: ${fe.message}`).join(', ');
    res.status(400).json({
      success: false,
      message: `Validation failed: ${summary}`,
      errors: formattedErrors,
    });
    return;
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${target} already exists`,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Requested record not found',
      });
      return;
    }
  }

  // 4. Fallback Unexpected Errors
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
