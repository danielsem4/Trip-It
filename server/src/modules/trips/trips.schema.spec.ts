import { describe, expect, it } from 'vitest';
import { COVER_COLORS, createTripSchema, updateTripSchema } from './trips.schema';

const valid = { title: 'Japan', destination: 'Tokyo', startDate: '2026-03-10' };

describe('createTripSchema', () => {
  it('rejects endDate before startDate', () => {
    expect(createTripSchema.safeParse({ ...valid, endDate: '2026-03-09' }).success).toBe(false);
  });

  it('accepts endDate equal to startDate', () => {
    expect(createTripSchema.safeParse({ ...valid, endDate: '2026-03-10' }).success).toBe(true);
  });

  it('accepts omitted endDate', () => {
    expect(createTripSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a 101-char title and accepts 100', () => {
    expect(createTripSchema.safeParse({ ...valid, title: 'a'.repeat(101) }).success).toBe(false);
    expect(createTripSchema.safeParse({ ...valid, title: 'a'.repeat(100) }).success).toBe(true);
  });

  it('rejects a 101-char destination and accepts 100', () => {
    expect(createTripSchema.safeParse({ ...valid, destination: 'a'.repeat(101) }).success).toBe(false);
    expect(createTripSchema.safeParse({ ...valid, destination: 'a'.repeat(100) }).success).toBe(true);
  });

  it('rejects a coverColor outside COVER_COLORS', () => {
    expect(createTripSchema.safeParse({ ...valid, coverColor: 'pink' }).success).toBe(false);
    expect(createTripSchema.safeParse({ ...valid, coverColor: COVER_COLORS[0] }).success).toBe(true);
  });
});

describe('updateTripSchema', () => {
  it('accepts endDate: null', () => {
    expect(updateTripSchema.safeParse({ endDate: null }).success).toBe(true);
  });
});
