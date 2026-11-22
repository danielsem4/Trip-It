import { geocoder, mapRepository } from '../map/geocoding';
import { createSafeFetch } from './safeFetch';
import { PhotoFiles } from './photo.store';
import { PhotoFinder } from './photo.finder';
import { PhotoRepository } from './photo.repository';
import { PhotoService } from './photo.service';

export type { PlacePhotos } from './photo.types';

const files = new PhotoFiles();
const finder = new PhotoFinder(mapRepository, geocoder, new PhotoRepository(), files, createSafeFetch());

export const placePhotos = new PhotoService(finder, files);
