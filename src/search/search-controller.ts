import { classifyError, describeError } from '../api/errors.js';
import { withTimeout } from '../utils/abort.js';
import type { SearchFn, SearchState } from './search-state.js';

export interface SearchControllerOptions {
  search: SearchFn;
  timeoutMs: number;
  onChange: (state: SearchState) => void;
}

/**
 * Owns the search lifecycle and knows nothing about the DOM.
 * Only one request is alive at a time: starting a new one aborts the previous
 * through its AbortController, so a slow stale response can never overwrite
 * the result of a newer query.
 */
export class SearchController {
  private readonly options: SearchControllerOptions;
  private currentState: SearchState = { status: 'idle' };
  private pending: AbortController | null = null;
  private lastQuery = '';

  constructor(options: SearchControllerOptions) {
    this.options = options;
  }

  get state(): SearchState {
    return this.currentState;
  }

  /** Aborts the in-flight request (if any) without changing the visible state. */
  cancelPending(): void {
    this.pending?.abort(new DOMException('Superseded by a newer query', 'AbortError'));
    this.pending = null;
  }

  async search(rawQuery: string): Promise<void> {
    this.cancelPending();

    const query = rawQuery.trim();
    this.lastQuery = query;

    if (query === '') {
      this.setState({ status: 'idle' });
      return;
    }

    const request = new AbortController();
    this.pending = request;
    this.setState({ status: 'loading', query });

    try {
      const signal = withTimeout(request.signal, this.options.timeoutMs);
      const countries = await this.options.search(query, signal);
      if (!this.isCurrent(request)) return;

      this.setState(
        countries.length > 0 ? { status: 'success', query, countries } : { status: 'empty', query },
      );
    } catch (error) {
      const kind = classifyError(error);
      if (kind === 'aborted' || !this.isCurrent(request)) return;

      this.setState({ status: 'error', query, kind, message: describeError(error) });
    } finally {
      if (this.isCurrent(request)) this.pending = null;
    }
  }

  retry(): Promise<void> {
    return this.search(this.lastQuery);
  }

  private isCurrent(request: AbortController): boolean {
    return this.pending === request;
  }

  private setState(state: SearchState): void {
    this.currentState = state;
    this.options.onChange(state);
  }
}
