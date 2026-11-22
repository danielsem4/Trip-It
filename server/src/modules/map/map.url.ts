import type { Coords } from './map.types';

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`;
// Most precise first: the pin itself, then an explicit query, then the viewport centre.
const PATTERNS = [
  new RegExp(`!3d${NUM}!4d${NUM}`),
  new RegExp(`[?&](?:q|query|ll|destination|daddr)=(?:loc:)?${NUM}(?:,|%2C)\\+?${NUM}(?:&|$)`, 'i'),
  new RegExp(`@${NUM},${NUM}`),
];

// Coordinates written inside a maps link, if any. Short links (maps.app.goo.gl) carry none,
// and are never fetched to find out.
export function coordsFromMapUrl(url: string | null): Coords | null {
  if (!url) return null;
  for (const pattern of PATTERNS) {
    const match = pattern.exec(url);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}
