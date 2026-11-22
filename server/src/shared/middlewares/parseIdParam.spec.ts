import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { parseIdParam } from './parseIdParam';
import { AppError } from '../errors/AppError';

function run(id: string) {
  const req = { params: { id } } as unknown as Request;
  const res = { locals: {} } as unknown as Response;
  const next = vi.fn();
  parseIdParam()(req, res, next);
  return { res, next };
}

describe('parseIdParam', () => {
  it.each(['1', '2147483647'])('accepts %s', (raw) => {
    const { res, next } = run(raw);
    expect(next).toHaveBeenCalledWith();
    expect(res.locals['id']).toBe(Number(raw));
  });

  it.each(['0', 'abc', '1.5', '2147483648', '3000000000'])('rejects %s with 404', (raw) => {
    const { next } = run(raw);
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(404);
  });
});
