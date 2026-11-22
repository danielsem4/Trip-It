import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  const e = err as { status?: unknown; statusCode?: unknown; message?: unknown } | null;
  const status = typeof e?.status === 'number' ? e.status : e?.statusCode;
  if (typeof status === 'number' && status >= 400 && status <= 499) {
    const message = status === 404 ? 'Not found' : String(e?.message ?? 'Request error');
    res.status(status).json({ message });
    return;
  }

  console.error('Unexpected error:', err);
  const detail = err instanceof Error ? err.message : String(err);
  res.status(500).json({ message: 'Internal server error', detail });
}
