import { describe, expect, it } from 'vitest';
import { normalizeQuery, placeQueries, transportQueries } from './map.queries';

describe('normalizeQuery', () => {
  it('trims, lowercases and collapses spaces', () => {
    expect(normalizeQuery('  Museumstraat 1,\n  Amsterdam ')).toBe('museumstraat 1, amsterdam');
  });
});

describe('placeQueries', () => {
  it('tries the address alone, then within the destination', () => {
    expect(placeQueries({ name: 'Rijksmuseum', address: 'Museumstraat 1' }, 'Amsterdam')).toEqual([
      'museumstraat 1',
      'museumstraat 1, amsterdam',
    ]);
  });

  it('falls back to the name within the destination', () => {
    expect(placeQueries({ name: 'Rijksmuseum', address: null }, 'Amsterdam')).toEqual(['rijksmuseum, amsterdam']);
    expect(placeQueries({ name: 'Rijksmuseum', address: '   ' }, 'Amsterdam')).toEqual(['rijksmuseum, amsterdam']);
  });

  it('drops texts too long to look up', () => {
    expect(placeQueries({ name: 'x', address: 'a'.repeat(260) }, 'Amsterdam')).toEqual([]);
  });
});

describe('transportQueries', () => {
  it('tries the place as typed first', () => {
    expect(transportQueries('Paris Gare du Nord', 'Amsterdam')).toEqual([
      'paris gare du nord',
      'paris gare du nord, amsterdam',
    ]);
  });

  it('has nothing to try for an empty end', () => {
    expect(transportQueries(null, 'Amsterdam')).toEqual([]);
  });
});
