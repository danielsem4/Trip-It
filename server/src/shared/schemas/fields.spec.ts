import { describe, expect, it } from 'vitest';
import { optionalText, optionalTime, optionalUrl, priceFields } from './fields';

describe('trip content fields', () => {
  it('turns blank optional text into null', () => {
    expect(optionalText().parse('  ')).toBeNull();
    expect(optionalText().parse(undefined)).toBeNull();
    expect(optionalText().parse(' a ')).toBe('a');
  });

  it('accepts only HH:mm times', () => {
    expect(optionalTime.parse('06:40')).toBe('06:40');
    expect(optionalTime.parse(null)).toBeNull();
    expect(optionalTime.safeParse('24:00').success).toBe(false);
    expect(optionalTime.safeParse('6:40').success).toBe(false);
  });

  it('accepts only http(s) links', () => {
    expect(optionalUrl.parse('https://maps.app.goo.gl/x')).toBe('https://maps.app.goo.gl/x');
    expect(optionalUrl.parse('')).toBeNull();
    expect(optionalUrl.safeParse('javascript:alert(1)').success).toBe(false);
    expect(optionalUrl.safeParse('booking.com').success).toBe(false);
  });

  it('rejects negative prices and malformed currencies', () => {
    expect(priceFields.priceAmount.safeParse(-1).success).toBe(false);
    expect(priceFields.priceCurrency.safeParse('eur').success).toBe(false);
    expect(priceFields.priceCurrency.parse('EUR')).toBe('EUR');
  });
});
