/**
 * Combines the caller's signal with a timeout.
 * The resulting signal aborts with the caller's reason (AbortError) or with
 * a TimeoutError from `AbortSignal.timeout`, whichever happens first.
 */
export function withTimeout(signal: AbortSignal, ms: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(ms);

  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeoutSignal]);
  }

  return anySignal([signal, timeoutSignal]);
}

/** Manual fallback for browsers without `AbortSignal.any`. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  const alreadyAborted = signals.find((source) => source.aborted);
  if (alreadyAborted) {
    controller.abort(alreadyAborted.reason);
    return controller.signal;
  }

  const cleanups: Array<() => void> = [];
  const cleanup = (): void => cleanups.forEach((remove) => remove());

  for (const source of signals) {
    const onAbort = (): void => {
      controller.abort(source.reason);
      cleanup();
    };
    source.addEventListener('abort', onAbort, { once: true });
    cleanups.push(() => source.removeEventListener('abort', onAbort));
  }

  return controller.signal;
}
