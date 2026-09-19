import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message} (Status: ${err.statusCode})`);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details || null,
      },
    });
  }

  // Unexpected or unhandled internal errors
  logger.error('Unhandled internal server error:', err);

  return res.status(500).json({
    success: false,
    error: {
      message: 'An internal server error occurred',
      statusCode: 500,
      details: null,
    },
  });
};
