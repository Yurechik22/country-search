import { describe, expect, it } from 'vitest';
import { SearchHistory, type KeyValueStorage } from '../src/history/search-history.js';

class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const KEY = 'test:history';

describe('SearchHistory', () => {
  it('is empty by default', () => {
    expect(new SearchHistory(new MemoryStorage(), KEY).list()).toEqual([]);
  });

  it('adds queries most-recent first and persists them', () => {
    const storage = new MemoryStorage();
    const history = new SearchHistory(storage, KEY);

    history.add('norway');
    history.add('sweden');

    expect(history.list()).toEqual(['sweden', 'norway']);
    expect(new SearchHistory(storage, KEY).list()).toEqual(['sweden', 'norway']);
  });

  it('trims, ignores blanks and moves duplicates to the top (case-insensitive)', () => {
    const history = new SearchHistory(new MemoryStorage(), KEY);

    history.add('norway');
    history.add('sweden');
    history.add('   ');
    history.add('  Norway ');

    expect(history.list()).toEqual(['Norway', 'sweden']);
  });

  it('keeps at most `limit` entries', () => {
    const history = new SearchHistory(new MemoryStorage(), KEY, 3);

    ['a', 'b', 'c', 'd'].forEach((query) => history.add(query));

    expect(history.list()).toEqual(['d', 'c', 'b']);
  });

  it('survives corrupted storage data', () => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, '{not json');

    expect(new SearchHistory(storage, KEY).list()).toEqual([]);

    storage.setItem(KEY, JSON.stringify([1, 'ok', null]));
    expect(new SearchHistory(storage, KEY).list()).toEqual(['ok']);
  });

  it('keeps working in memory when storage throws', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const history = new SearchHistory(broken, KEY);

    history.add('norway');

    expect(history.list()).toEqual(['norway']);
  });

  it('clear() removes everything', () => {
    const storage = new MemoryStorage();
    const history = new SearchHistory(storage, KEY);
    history.add('norway');

    history.clear();

    expect(history.list()).toEqual([]);
    expect(storage.getItem(KEY)).toBeNull();
  });
});
