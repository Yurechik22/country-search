export interface Debounced<Args extends unknown[]> {
  (...args: Args): void;
  /** Drops the pending call, if any. */
  cancel(): void;
}

/**
 * Returns a function that postpones `fn` until `delay` ms have passed
 * since the last call. Every new call resets the timer, so only the
 * latest arguments reach `fn`.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): Debounced<Args> {
  if (delay < 0 || !Number.isFinite(delay)) {
    throw new RangeError(`Debounce delay must be a non-negative number, got ${delay}`);
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  };

  const debounced = (...args: Args): void => {
    cancel();
    timerId = setTimeout(() => {
      timerId = undefined;
      fn(...args);
    }, delay);
  };

  return Object.assign(debounced, { cancel });
}
