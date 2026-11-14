import type { RawCountry } from '../api/types.js';
import type { Country } from './country.js';

export function mapCountryResponse(_raw: RawCountry): Country {
  throw new Error('Not implemented');
}
