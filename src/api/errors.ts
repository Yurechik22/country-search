/** Thrown for any non-ok HTTP response except 404 (which means "no matches"). */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message = `Request failed with HTTP status ${status}`) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export type ErrorKind = 'aborted' | 'timeout' | 'http' | 'network';

function hasName(error: unknown, name: string): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === name;
}

/**
 * Splits a failed request into the cases the UI handles differently:
 * - `aborted`  – we cancelled it ourselves (newer query): show nothing;
 * - `timeout`  – AbortSignal.timeout fired: show an error;
 * - `http`     – server answered with a non-ok status: error + retry;
 * - `network`  – fetch rejected (offline, DNS, CORS…): error + retry.
 */
export function classifyError(error: unknown): ErrorKind {
  if (error instanceof HttpError) return 'http';
  if (hasName(error, 'AbortError')) return 'aborted';
  if (hasName(error, 'TimeoutError')) return 'timeout';
  return 'network';
}

export function describeError(error: unknown): string {
  switch (classifyError(error)) {
    case 'timeout':
      return 'The server is taking too long to respond. Please try again.';
    case 'http':
      return `The server returned an error (HTTP ${(error as HttpError).status}).`;
    case 'network':
      return 'Network error. Check your connection and try again.';
    case 'aborted':
      return 'The request was cancelled.';
  }
}
