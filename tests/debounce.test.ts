import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../src/utils/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call the function before the delay passes', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('a');
    vi.advanceTimersByTime(299);

    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('calls the function once after the delay with the latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('a');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('resets the timer on every new call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('n');
    vi.advanceTimersByTime(200);
    debounced('no');
    vi.advanceTimersByTime(200);
    debounced('nor');
    vi.advanceTimersByTime(299);

    expect(fn).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('nor');
  });

  it('fires again for calls separated by more than the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced(1);
    vi.advanceTimersByTime(100);
    debounced(2);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it('cancel() drops the pending call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('x');
    debounced.cancel();
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('throws on a negative delay', () => {
    expect(() => debounce(vi.fn(), -1)).toThrow(RangeError);
  });
});
