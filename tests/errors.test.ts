import { describe, expect, it } from 'vitest';
import { HttpError, classifyError, describeError } from '../src/api/errors.js';
import { withTimeout } from '../src/utils/abort.js';
import { abortError, timeoutError } from './helpers/fetch-mock.js';

describe('classifyError', () => {
  it('treats AbortError as the user cancelling the request', () => {
    expect(classifyError(abortError())).toBe('aborted');
  });

  it('treats TimeoutError as a timeout', () => {
    expect(classifyError(timeoutError())).toBe('timeout');
  });

  it('treats HttpError as an http failure', () => {
    expect(classifyError(new HttpError(500))).toBe('http');
  });

  it('treats anything else (e.g. fetch TypeError) as a network failure', () => {
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('network');
    expect(classifyError('weird')).toBe('network');
    expect(classifyError(null)).toBe('network');
  });

  it('recognises errors by name, not only by DOMException class', () => {
    const plain = Object.assign(new Error('aborted'), { name: 'AbortError' });

    expect(classifyError(plain)).toBe('aborted');
  });
});

describe('describeError', () => {
  it('returns a user-facing message for each error kind', () => {
    expect(describeError(timeoutError())).toMatch(/too long/i);
    expect(describeError(new HttpError(503))).toContain('503');
    expect(describeError(new TypeError('Failed to fetch'))).toMatch(/network/i);
  });
});

describe('withTimeout', () => {
  it('aborts with TimeoutError when the time is up', async () => {
    const signal = withTimeout(new AbortController().signal, 10);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(signal.aborted).toBe(true);
    expect(classifyError(signal.reason)).toBe('timeout');
  });

  it('aborts with AbortError when the user signal aborts first', () => {
    const controller = new AbortController();
    const signal = withTimeout(controller.signal, 10_000);

    controller.abort();

    expect(signal.aborted).toBe(true);
    expect(classifyError(signal.reason)).toBe('aborted');
  });

  it('is already aborted if the user signal was aborted before', () => {
    const controller = new AbortController();
    controller.abort();

    expect(withTimeout(controller.signal, 10_000).aborted).toBe(true);
  });
});
