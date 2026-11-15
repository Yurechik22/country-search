import { describe, expect, it, vi } from 'vitest';
import { classifyError } from '../src/api/errors.js';
import type { Country } from '../src/domain/country.js';
import { mapCountryResponse } from '../src/domain/map-country.js';
import { createCachedSearch } from '../src/search/cached-search.js';
import type { SearchFn } from '../src/search/search-state.js';
import { norwayRaw } from './fixtures/countries.js';
import { rejectOnAbort } from './helpers/fetch-mock.js';

const norway: Country = mapCountryResponse(norwayRaw);

/** A search whose requests stay pending until resolved by hand. */
function createManualSearch() {
  const requests: Array<{ query: string; signal: AbortSignal; resolve: (v: Country[]) => void }> =
    [];
  const search = vi.fn<SearchFn>(
    (query, signal) =>
      new Promise<Country[]>((resolve, reject) => {
        requests.push({ query, signal, resolve });
        rejectOnAbort(signal).catch(reject);
      }),
  );
  return { search, requests };
}

describe('createCachedSearch', () => {
  it('returns the cached result for a repeated query without a new request', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([norway]);
    const cached = createCachedSearch(search);

    await cached.search('nor', new AbortController().signal);
    const second = await cached.search('nor', new AbortController().signal);

    expect(search).toHaveBeenCalledTimes(1);
    expect(second).toEqual([norway]);
  });

  it('normalises the key (case and surrounding spaces)', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([norway]);
    const cached = createCachedSearch(search);

    await cached.search('Nor', new AbortController().signal);
    await cached.search('  nor ', new AbortController().signal);

    expect(search).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const { search, requests } = createManualSearch();
    const cached = createCachedSearch(search);

    const a = cached.search('nor', new AbortController().signal);
    const b = cached.search('nor', new AbortController().signal);
    requests[0]?.resolve([norway]);

    await expect(Promise.all([a, b])).resolves.toEqual([[norway], [norway]]);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("one caller's abort does not break the shared request for others", async () => {
    const { search, requests } = createManualSearch();
    const cached = createCachedSearch(search);
    const callerA = new AbortController();

    const a = cached.search('nor', callerA.signal);
    const b = cached.search('nor', new AbortController().signal);
    callerA.abort();
    requests[0]?.resolve([norway]);

    await expect(a).rejects.toMatchObject({ name: 'AbortError' });
    await expect(b).resolves.toEqual([norway]);
    expect(requests[0]?.signal.aborted).toBe(false);
  });

  it('aborts the underlying request when every caller has aborted', async () => {
    const { search, requests } = createManualSearch();
    const cached = createCachedSearch(search);
    const callerA = new AbortController();
    const callerB = new AbortController();

    const a = cached.search('nor', callerA.signal);
    const b = cached.search('nor', callerB.signal);
    callerA.abort();
    callerB.abort();

    await expect(a).rejects.toMatchObject({ name: 'AbortError' });
    await expect(b).rejects.toMatchObject({ name: 'AbortError' });
    expect(requests[0]?.signal.aborted).toBe(true);
    expect(classifyError(requests[0]?.signal.reason)).toBe('aborted');
  });

  it('starts a fresh request after the previous one was fully aborted', async () => {
    const { search, requests } = createManualSearch();
    const cached = createCachedSearch(search);
    const caller = new AbortController();

    const first = cached.search('nor', caller.signal);
    caller.abort();
    await first.catch(() => undefined);

    const second = cached.search('nor', new AbortController().signal);
    requests[1]?.resolve([norway]);

    await expect(second).resolves.toEqual([norway]);
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('rejects immediately for an already aborted signal', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([norway]);
    const cached = createCachedSearch(search);
    const caller = new AbortController();
    caller.abort();

    await expect(cached.search('nor', caller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('does not cache failures', async () => {
    const search = vi
      .fn<SearchFn>()
      .mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
      .mockResolvedValue([norway]);
    const cached = createCachedSearch(search);

    await expect(cached.search('nor', new AbortController().signal)).rejects.toBeInstanceOf(
      TypeError,
    );
    await expect(cached.search('nor', new AbortController().signal)).resolves.toEqual([norway]);
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('keeps different queries apart', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([]);
    const cached = createCachedSearch(search);

    await cached.search('nor', new AbortController().signal);
    await cached.search('swe', new AbortController().signal);

    expect(search).toHaveBeenCalledTimes(2);
  });

  it('clear() drops cached results', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([norway]);
    const cached = createCachedSearch(search);

    await cached.search('nor', new AbortController().signal);
    cached.clear();
    await cached.search('nor', new AbortController().signal);

    expect(search).toHaveBeenCalledTimes(2);
  });
});
