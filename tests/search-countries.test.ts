import { describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, searchCountries } from '../src/api/countries-api.js';
import { HttpError } from '../src/api/errors.js';
import { norwayRaw } from './fixtures/countries.js';
import { abortError, jsonResponse, rejectOnAbort } from './helpers/fetch-mock.js';

describe('HttpError', () => {
  it('stores the HTTP status and has a readable name', () => {
    const error = new HttpError(503);

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(503);
    expect(error.name).toBe('HttpError');
    expect(error.message).toContain('503');
  });
});

describe('searchCountries', () => {
  it('requests /name/{query} with the given signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([norwayRaw]));
    vi.stubGlobal('fetch', fetchMock);
    const { signal } = new AbortController();

    await searchCountries('nor', signal);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/name/nor`, { signal });
  });

  it('URL-encodes the query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await searchCountries('côte d/ivoire', new AbortController().signal);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE_URL}/name/c%C3%B4te%20d%2Fivoire`);
  });

  it('returns the parsed array on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([norwayRaw])));

    await expect(searchCountries('nor', new AbortController().signal)).resolves.toEqual([
      norwayRaw,
    ]);
  });

  it('returns an empty list on 404 (no matches is not an error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 404, message: 'Not Found' }, 404)),
    );

    await expect(searchCountries('qqq', new AbortController().signal)).resolves.toEqual([]);
  });

  it('throws HttpError with the status for other non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    const request = searchCountries('nor', new AbortController().signal);

    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({ status: 500 });
  });

  it('propagates AbortError when the signal is aborted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => rejectOnAbort(init?.signal)),
    );
    const controller = new AbortController();

    const request = searchCountries('nor', controller.signal);
    controller.abort(abortError());

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('propagates network failures as they are', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(searchCountries('nor', new AbortController().signal)).rejects.toBeInstanceOf(
      TypeError,
    );
  });
});
