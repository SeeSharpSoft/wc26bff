import { useEffect, useState } from 'react';
import { DEV_NOW_EVENT, resolveNow } from '../utils/devClock';

/**
 * Returns the current time in epoch ms, refreshed on an interval so that
 * time-derived UI (e.g. bet locking at kickoff) updates while the page stays
 * open. Reading the clock happens in a state initializer / effect, never in the
 * render body, to keep components pure.
 *
 * Respects the developer clock override (see {@link resolveNow}); when an
 * override is active the hook returns that fixed instant and updates whenever
 * the override changes (`wc26:devnow` event or cross-tab `storage` event).
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => resolveNow());

  useEffect(() => {
    const tick = () => setNow(resolveNow());
    const id = setInterval(tick, intervalMs);
    window.addEventListener(DEV_NOW_EVENT, tick);
    window.addEventListener('storage', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener(DEV_NOW_EVENT, tick);
      window.removeEventListener('storage', tick);
    };
  }, [intervalMs]);

  return now;
}
