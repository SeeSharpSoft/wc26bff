import { useEffect } from 'react';
import { useResults } from '../context/ResultsContext';
import { useViewerMode } from '../context/ViewerModeContext';

/**
 * Syncs results once whenever viewer mode is *entered* — at launch (viewer mode is
 * the default) and whenever the user switches back from their own input to viewer
 * mode. It does not poll: further refreshes happen via the manual "Sync" button.
 * Renders nothing.
 */
export function AutoResultsSync() {
  const { sync } = useResults();
  const { viewerMode } = useViewerMode();

  useEffect(() => {
    if (!viewerMode) return;
    void sync();
  }, [viewerMode, sync]);

  return null;
}
