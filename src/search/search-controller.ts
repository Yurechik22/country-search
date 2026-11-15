import type { SearchFn, SearchState } from './search-state.js';

export interface SearchControllerOptions {
  search: SearchFn;
  timeoutMs: number;
  onChange: (state: SearchState) => void;
}

export class SearchController {
  constructor(_options: SearchControllerOptions) {}

  get state(): SearchState {
    throw new Error('Not implemented');
  }

  cancelPending(): void {
    throw new Error('Not implemented');
  }

  search(_query: string): Promise<void> {
    throw new Error('Not implemented');
  }

  retry(): Promise<void> {
    throw new Error('Not implemented');
  }
}
