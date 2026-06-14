import { useEffect } from 'react';
import { useResults } from '../context/ResultsContext';
import { useViewerMode } from '../context/ViewerModeContext';

/** How often to refresh results while viewer mode is active (live updates). */
export const AUTO_SYNC_INTERVAL_MS = 60_000;

/**
 * Keeps results fresh while viewer mode is enabled: syncs once on entering viewer
 * mode and then on an interval, so a shared viewing screen picks up live in-play
 * scores and final results without anyone clicking "Sync". Renders nothing.
 */
export function AutoResultsSync() {
  const { sync } = useResults();
  const { viewerMode } = useViewerMode();

  useEffect(() => {
    if (!viewerMode) return;
    void sync();
    const id = setInterval(() => void sync(), AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [viewerMode, sync]);

  return null;
}
