export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

export function timeoutError(): DOMException {
  return new DOMException('The operation timed out.', 'TimeoutError');
}

/**
 * Promise that settles like fetch does when its signal aborts:
 * it rejects with `signal.reason` (AbortError or TimeoutError).
 */
export function rejectOnAbort(signal: AbortSignal | null | undefined): Promise<never> {
  return new Promise((_, reject) => {
    if (!signal) return;
    if (signal.aborted) {
      reject(signal.reason ?? abortError());
      return;
    }
    signal.addEventListener('abort', () => reject(signal.reason ?? abortError()), { once: true });
  });
}
