/** Thrown for any non-ok HTTP response except 404 (which means "no matches"). */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message = `Request failed with HTTP status ${status}`) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
