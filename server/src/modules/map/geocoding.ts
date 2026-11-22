import { NominatimGeocoder } from './geocoder';
import { MapRepository } from './map.repository';

// One store and one queue for the whole process: the map and place photos share the rate limit.
export const mapRepository = new MapRepository();
export const geocoder = new NominatimGeocoder(mapRepository, {
  baseUrl: process.env['GEOCODER_URL'] || undefined,
});
