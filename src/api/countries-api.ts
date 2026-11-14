import type { RawCountry } from './types.js';

export const API_BASE_URL = 'https://countries.dev';

export async function searchCountries(_query: string, _signal: AbortSignal): Promise<RawCountry[]> {
  throw new Error('Not implemented');
}
