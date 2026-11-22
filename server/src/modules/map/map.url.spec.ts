import { describe, expect, it } from 'vitest';
import { coordsFromMapUrl } from './map.url';

describe('coordsFromMapUrl', () => {
  it('reads the viewport centre of a place link', () => {
    expect(coordsFromMapUrl('https://www.google.com/maps/place/Rijksmuseum/@52.3599976,4.8852188,17z')).toEqual({
      lat: 52.3599976,
      lng: 4.8852188,
    });
  });

  it('prefers the pin over the viewport centre', () => {
    const url = 'https://www.google.com/maps/place/X/@52.36,4.88,17z/data=!3m1!4b1!4m6!3m5!8m2!3d52.3731!4d4.8922';
    expect(coordsFromMapUrl(url)).toEqual({ lat: 52.3731, lng: 4.8922 });
  });

  it('reads q= and ll= coordinates, including negative and encoded ones', () => {
    expect(coordsFromMapUrl('https://maps.google.com/?q=-33.8568,151.2153')).toEqual({ lat: -33.8568, lng: 151.2153 });
    expect(coordsFromMapUrl('https://maps.apple.com/?ll=40.7128%2C-74.006&z=12')).toEqual({ lat: 40.7128, lng: -74.006 });
  });

  it('finds nothing in short links, text queries and empty values', () => {
    expect(coordsFromMapUrl('https://maps.app.goo.gl/AbCdEf123')).toBeNull();
    expect(coordsFromMapUrl('https://maps.google.com/?q=Rijksmuseum+Amsterdam')).toBeNull();
    expect(coordsFromMapUrl(null)).toBeNull();
  });

  it('rejects numbers that are not coordinates', () => {
    expect(coordsFromMapUrl('https://example.com/@123.5,400.2')).toBeNull();
  });
});
