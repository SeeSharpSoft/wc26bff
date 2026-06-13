import { useEffect, useState } from 'react';

/**
 * Returns the current time in epoch ms, refreshed on an interval so that
 * time-derived UI (e.g. bet locking at kickoff) updates while the page stays
 * open. Reading the clock happens in a state initializer / effect, never in the
 * render body, to keep components pure.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
