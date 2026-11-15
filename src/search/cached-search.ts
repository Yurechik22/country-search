import type { SearchFn } from './search-state.js';

export interface CachedSearch {
  search: SearchFn;
  clear(): void;
}

export function createCachedSearch(_search: SearchFn): CachedSearch {
  throw new Error('Not implemented');
}
