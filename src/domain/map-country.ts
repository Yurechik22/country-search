import type { RawCountry, RawCurrency } from '../api/types.js';
import type { Country } from './country.js';

const UNKNOWN = 'Unknown';
const NO_VALUE = '—';

function normalizeCapital(capital: RawCountry['capital']): string {
  const parts = Array.isArray(capital) ? capital : [capital];
  const names = parts.filter((part): part is string => Boolean(part));
  return names.length > 0 ? names.join(', ') : NO_VALUE;
}

function formatCurrency({ name, code, symbol }: RawCurrency): string {
  const meta = symbol ? `${code}, ${symbol}` : code;
  return `${name} (${meta})`;
}

function buildDescription(raw: RawCountry): string {
  const nativePart = raw.nativeName && raw.nativeName !== raw.name ? ` (${raw.nativeName})` : '';
  const location = raw.subregion ?? raw.region ?? 'the world';
  const people = raw.demonym ? ` Its people are called ${raw.demonym}.` : '';
  return `${raw.name}${nativePart} is a country in ${location}.${people}`;
}

/**
 * Pure mapper from the API record to the UI model.
 * Missing optional fields get display-safe defaults; the input is never mutated.
 */
export function mapCountryResponse(raw: RawCountry): Country {
  return {
    code: raw.alpha3Code,
    name: raw.name,
    flag: raw.flag ?? '',
    flagUrl: raw.flags?.svg ?? raw.flags?.png ?? '',
    capital: normalizeCapital(raw.capital),
    region: raw.region || UNKNOWN,
    population: raw.population ?? 0,
    languages: (raw.languages ?? []).map((language) => language.name),
    currencies: (raw.currencies ?? []).map(formatCurrency),
    area: raw.area ?? null,
    borders: [...(raw.borders ?? [])],
    description: raw.description ?? buildDescription(raw),
  };
}
