import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import { HttpError } from '../services/httpError.ts';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

// Express identifies error handlers by their 4-argument signature.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ error: 'Already exists', details: err.errors.map((e) => e.path) });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors.map((e) => e.message) });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
