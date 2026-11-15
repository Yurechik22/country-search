import { HttpError } from './errors.js';
import type { RawCountry } from './types.js';

export const API_BASE_URL = 'https://countries.dev';

const NOT_FOUND = 404;

/**
 * Searches countries by (partial) name.
 * - 404 means "no matches" and resolves to an empty list;
 * - any other non-ok status throws `HttpError`;
 * - abort/timeout/network errors from `fetch` propagate unchanged.
 */
export async function searchCountries(query: string, signal: AbortSignal): Promise<RawCountry[]> {
  const url = `${API_BASE_URL}/name/${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal });

  if (response.status === NOT_FOUND) {
    return [];
  }
  if (!response.ok) {
    throw new HttpError(response.status);
  }

  const data: unknown = await response.json();
  return Array.isArray(data) ? (data as RawCountry[]) : [];
}
