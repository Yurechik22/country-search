export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super('Not implemented');
    this.status = Number.NaN;
    void status;
  }
}
