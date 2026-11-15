import type { ErrorKind } from '../api/errors.js';
import type { Country } from '../domain/country.js';

export type VisibleErrorKind = Exclude<ErrorKind, 'aborted'>;

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'success'; query: string; countries: Country[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; kind: VisibleErrorKind; message: string };

export type SearchFn = (query: string, signal: AbortSignal) => Promise<Country[]>;
