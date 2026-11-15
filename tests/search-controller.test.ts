import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../src/api/errors.js';
import type { Country } from '../src/domain/country.js';
import { mapCountryResponse } from '../src/domain/map-country.js';
import { SearchController } from '../src/search/search-controller.js';
import type { SearchFn, SearchState } from '../src/search/search-state.js';
import { norwayRaw } from './fixtures/countries.js';
import { rejectOnAbort, timeoutError } from './helpers/fetch-mock.js';

const norway: Country = mapCountryResponse(norwayRaw);

function setup(search: SearchFn) {
  const states: SearchState[] = [];
  const controller = new SearchController({
    search,
    timeoutMs: 5_000,
    onChange: (state) => states.push(state),
  });
  return { controller, states, statuses: () => states.map((state) => state.status) };
}

describe('SearchController', () => {
  it('starts idle', () => {
    const { controller } = setup(vi.fn());

    expect(controller.state).toEqual({ status: 'idle' });
  });

  it('does not send a request for an empty or blank query and clears results', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([norway]);
    const { controller } = setup(search);

    await controller.search('nor');
    await controller.search('   ');

    expect(search).toHaveBeenCalledTimes(1);
    expect(controller.state).toEqual({ status: 'idle' });
  });

  it('goes loading → success and trims the query', async () => {
    const search = vi.fn<SearchFn>().mockResolvedValue([norway]);
    const { controller, statuses } = setup(search);

    await controller.search('  nor ');

    expect(search).toHaveBeenCalledWith('nor', expect.any(AbortSignal));
    expect(statuses()).toEqual(['loading', 'success']);
    expect(controller.state).toEqual({ status: 'success', query: 'nor', countries: [norway] });
  });

  it('shows "empty" (not an error) when nothing matches', async () => {
    const { controller } = setup(vi.fn<SearchFn>().mockResolvedValue([]));

    await controller.search('qqq');

    expect(controller.state).toEqual({ status: 'empty', query: 'qqq' });
  });

  it('shows an http error for HttpError', async () => {
    const { controller } = setup(vi.fn<SearchFn>().mockRejectedValue(new HttpError(500)));

    await controller.search('nor');

    expect(controller.state).toMatchObject({ status: 'error', kind: 'http', query: 'nor' });
  });

  it('shows a network error when fetch rejects', async () => {
    const { controller } = setup(
      vi.fn<SearchFn>().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await controller.search('nor');

    expect(controller.state).toMatchObject({ status: 'error', kind: 'network' });
  });

  it('shows a timeout error for TimeoutError', async () => {
    const { controller } = setup(vi.fn<SearchFn>().mockRejectedValue(timeoutError()));

    await controller.search('nor');

    expect(controller.state).toMatchObject({ status: 'error', kind: 'timeout' });
  });

  it('times out a request that hangs longer than timeoutMs', async () => {
    const states: SearchState[] = [];
    const controller = new SearchController({
      search: (_query, signal) => rejectOnAbort(signal),
      timeoutMs: 10,
      onChange: (state) => states.push(state),
    });

    await controller.search('nor');

    expect(controller.state).toMatchObject({ status: 'error', kind: 'timeout' });
  });

  it('aborts the previous request when a new search starts', async () => {
    const signals: AbortSignal[] = [];
    const search = vi.fn<SearchFn>((_query, signal) => {
      signals.push(signal);
      return rejectOnAbort(signal);
    });
    const { controller } = setup(search);

    void controller.search('no');
    void controller.search('nor');

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('never shows its own cancellation as an error', async () => {
    const { controller, statuses } = setup((_query, signal) => rejectOnAbort(signal));

    const first = controller.search('no');
    controller.cancelPending();
    await first;

    expect(statuses()).not.toContain('error');
  });

  it('retry() repeats the last query', async () => {
    const search = vi
      .fn<SearchFn>()
      .mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
      .mockResolvedValue([norway]);
    const { controller } = setup(search);

    await controller.search('nor');
    expect(controller.state.status).toBe('error');

    await controller.retry();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1]?.[0]).toBe('nor');
    expect(controller.state.status).toBe('success');
  });
});
