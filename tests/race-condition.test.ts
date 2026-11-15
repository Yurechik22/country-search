import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCountries } from '../src/api/countries-api.js';
import { mapCountryResponse } from '../src/domain/map-country.js';
import { SearchController } from '../src/search/search-controller.js';
import type { SearchState } from '../src/search/search-state.js';
import { debounce } from '../src/utils/debounce.js';
import { norwayRaw, swedenRaw } from './fixtures/countries.js';
import { jsonResponse } from './helpers/fetch-mock.js';

interface Route {
  delay: number;
  body: unknown;
}

/**
 * fetch mock with a per-query latency. When `respectAbort` is true it behaves
 * like real fetch: an aborted request rejects with `signal.reason` (AbortError).
 */
function createDelayedFetch(routes: Record<string, Route>, respectAbort = true) {
  const signals: Record<string, AbortSignal> = {};

  const fetchMock = vi.fn(
    (url: string, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const query = decodeURIComponent(url.split('/name/')[1] ?? '');
        const route = routes[query];
        if (!route) throw new Error(`Unexpected query ${query}`);
        const signal = init?.signal ?? undefined;
        if (signal) signals[query] = signal;

        const timer = setTimeout(() => resolve(jsonResponse(route.body)), route.delay);

        if (respectAbort && signal) {
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              reject(signal.reason);
            },
            { once: true },
          );
        }
      }),
  );

  return { fetchMock, signals };
}

function createController() {
  const states: SearchState[] = [];
  const controller = new SearchController({
    search: async (query, signal) => (await searchCountries(query, signal)).map(mapCountryResponse),
    timeoutMs: 8_000,
    onChange: (state) => states.push(state),
  });
  return { controller, states };
}

const shownCountryNames = (states: SearchState[]): string[] =>
  states.flatMap((state) =>
    state.status === 'success' ? state.countries.map((country) => country.name) : [],
  );

describe('race condition: earlier request resolves after the later one', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps only the latest query result and aborts the stale request', async () => {
    const { fetchMock, signals } = createDelayedFetch({
      swe: { delay: 500, body: [swedenRaw] }, // first, slow
      nor: { delay: 50, body: [norwayRaw] }, // second, fast
    });
    vi.stubGlobal('fetch', fetchMock);
    const { controller, states } = createController();

    const first = controller.search('swe');
    const second = controller.search('nor');
    await vi.advanceTimersByTimeAsync(600);
    await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(signals.swe?.aborted).toBe(true);
    expect(signals.nor?.aborted).toBe(false);
    expect(controller.state).toMatchObject({ status: 'success', query: 'nor' });
    expect(shownCountryNames(states)).toEqual(['Norway']);
    expect(states.map((state) => state.status)).not.toContain('error');
  });

  it('ignores a stale response even if the transport does not honour abort', async () => {
    const { fetchMock } = createDelayedFetch(
      {
        swe: { delay: 500, body: [swedenRaw] },
        nor: { delay: 50, body: [norwayRaw] },
      },
      false,
    );
    vi.stubGlobal('fetch', fetchMock);
    const { controller, states } = createController();

    const first = controller.search('swe');
    const second = controller.search('nor');
    await vi.advanceTimersByTimeAsync(600);
    await Promise.all([first, second]);

    expect(controller.state).toMatchObject({ status: 'success', query: 'nor' });
    expect(shownCountryNames(states)).toEqual(['Norway']);
  });

  it('fast typing through debounce sends a single request for the final text', async () => {
    const { fetchMock } = createDelayedFetch({ nor: { delay: 50, body: [norwayRaw] } });
    vi.stubGlobal('fetch', fetchMock);
    const { controller } = createController();
    const debouncedSearch = debounce((query: string) => void controller.search(query), 300);

    for (const text of ['n', 'no', 'nor']) {
      controller.cancelPending();
      debouncedSearch(text);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(400);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(controller.state).toMatchObject({ status: 'success', query: 'nor' });
  });
});
