/** The subset of the Web Storage API we need; lets tests use an in-memory store. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SearchHistory {
  constructor(_storage: KeyValueStorage, _key: string, _limit = 8) {}

  list(): string[] {
    throw new Error('Not implemented');
  }

  add(_query: string): string[] {
    throw new Error('Not implemented');
  }

  clear(): void {
    throw new Error('Not implemented');
  }
}
