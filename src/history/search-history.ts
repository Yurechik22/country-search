/** The subset of the Web Storage API we need; lets tests use an in-memory store. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Recent successful queries, most recent first, persisted in storage.
 * Storage failures (private mode, quota, corrupted JSON) never break the app:
 * the history then simply lives in memory for the session.
 */
export class SearchHistory {
  private readonly storage: KeyValueStorage;
  private readonly key: string;
  private readonly limit: number;
  private entries: string[];

  constructor(storage: KeyValueStorage, key: string, limit = 8) {
    this.storage = storage;
    this.key = key;
    this.limit = limit;
    this.entries = this.load();
  }

  list(): string[] {
    return [...this.entries];
  }

  add(rawQuery: string): string[] {
    const query = rawQuery.trim();
    if (query === '') return this.list();

    const lower = query.toLowerCase();
    const rest = this.entries.filter((entry) => entry.toLowerCase() !== lower);
    this.entries = [query, ...rest].slice(0, this.limit);
    this.save();
    return this.list();
  }

  clear(): void {
    this.entries = [];
    try {
      this.storage.removeItem(this.key);
    } catch {
      // Storage unavailable: in-memory history is already cleared.
    }
  }

  private load(): string[] {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(this.key) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is string => typeof item === 'string').slice(0, this.limit);
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.entries));
    } catch {
      // Storage unavailable or full: keep the in-memory copy only.
    }
  }
}
