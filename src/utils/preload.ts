/**
 * Loads lazy chunks once the browser is idle, so views opened later (for
 * example the task form while offline) do not depend on the network.
 * Failures are ignored here; the real `lazy()` import reports them.
 */
export function preloadWhenIdle(...loaders: Array<() => Promise<unknown>>): void {
  if (typeof window === 'undefined') return;
  const run = () => {
    for (const load of loaders) load().catch(() => undefined);
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
