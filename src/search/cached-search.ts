import type { Country } from '../domain/country.js';
import type { SearchFn } from './search-state.js';

export interface CachedSearch {
  search: SearchFn;
  clear(): void;
}

interface CacheEntry {
  promise: Promise<Country[]>;
  /** Controls the single shared request; never handed to callers. */
  controller: AbortController;
  subscribers: number;
  settled: boolean;
}

const normalizeKey = (query: string): string => query.trim().toLowerCase();

/**
 * Wraps a search with a cache keyed by the normalised query.
 *
 * - A finished successful result is reused: O(1) Map lookup, no request.
 * - Concurrent calls for the same key share one in-flight request.
 * - Every caller passes its own signal. Aborting it rejects only that
 *   caller's promise; the shared request keeps running for the others.
 *   When the last caller leaves, the shared request is aborted and the
 *   entry is dropped, so the browser really cancels it.
 * - Failures are never cached.
 */
export function createCachedSearch(search: SearchFn): CachedSearch {
  const cache = new Map<string, CacheEntry>();

  function createEntry(key: string, query: string): CacheEntry {
    const controller = new AbortController();
    const entry: CacheEntry = {
      controller,
      subscribers: 0,
      settled: false,
      promise: Promise.resolve([]),
    };

    entry.promise = search(query, controller.signal).then(
      (countries) => {
        entry.settled = true;
        return countries;
      },
      (error: unknown) => {
        if (cache.get(key) === entry) cache.delete(key);
        throw error;
      },
    );
    // Rejections are delivered to subscribers; avoid "unhandled" noise when none are left.
    entry.promise.catch(() => undefined);

    cache.set(key, entry);
    return entry;
  }

  function subscribe(key: string, entry: CacheEntry, signal: AbortSignal): Promise<Country[]> {
    if (entry.settled) return entry.promise;

    entry.subscribers += 1;
    let active = true;

    const leave = (): void => {
      if (!active) return;
      active = false;
      entry.subscribers -= 1;
    };

    return new Promise<Country[]>((resolve, reject) => {
      const onAbort = (): void => {
        leave();
        if (entry.subscribers === 0 && !entry.settled) {
          entry.controller.abort(signal.reason);
          if (cache.get(key) === entry) cache.delete(key);
        }
        reject(signal.reason);
      };

      signal.addEventListener('abort', onAbort, { once: true });

      entry.promise.then(
        (countries) => {
          signal.removeEventListener('abort', onAbort);
          leave();
          resolve(countries);
        },
        (error: unknown) => {
          signal.removeEventListener('abort', onAbort);
          leave();
          reject(error);
        },
      );
    });
  }

  return {
    search(query: string, signal: AbortSignal): Promise<Country[]> {
      if (signal.aborted) return Promise.reject(signal.reason);

      const key = normalizeKey(query);
      const entry = cache.get(key) ?? createEntry(key, query);
      return subscribe(key, entry, signal);
    },
    clear(): void {
      cache.clear();
    },
  };
}
