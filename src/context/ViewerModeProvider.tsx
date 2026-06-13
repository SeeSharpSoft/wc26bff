import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ViewerModeContext, type ViewerModeContextValue } from './ViewerModeContext';

export function ViewerModeProvider({ children }: { children: ReactNode }) {
  // Viewer mode is a transient, non-user-specific view toggle. It is intentionally
  // not persisted: each session starts in personal betting mode.
  const [viewerMode, setViewerMode] = useState(false);

  const toggleViewerMode = useCallback(() => setViewerMode((v) => !v), []);

  const value = useMemo<ViewerModeContextValue>(
    () => ({ viewerMode, setViewerMode, toggleViewerMode }),
    [viewerMode, toggleViewerMode],
  );

  return (
    <ViewerModeContext.Provider value={value}>{children}</ViewerModeContext.Provider>
  );
}
