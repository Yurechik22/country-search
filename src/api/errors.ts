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

export function classifyError(_error: unknown): ErrorKind {
  throw new Error('Not implemented');
}

export function describeError(_error: unknown): string {
  throw new Error('Not implemented');
}
