import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ViewerModeContext, type ViewerModeContextValue } from './ViewerModeContext';

export function ViewerModeProvider({ children }: { children: ReactNode }) {
  // Viewer mode is a transient, non-user-specific view toggle. It is intentionally
  // not persisted, but each session *starts* in viewer mode so a fresh visitor (or
  // a shared screen) immediately sees everyone's guesses and live results.
  const [viewerMode, setViewerMode] = useState(true);

  const toggleViewerMode = useCallback(() => setViewerMode((v) => !v), []);

  const value = useMemo<ViewerModeContextValue>(
    () => ({ viewerMode, setViewerMode, toggleViewerMode }),
    [viewerMode, toggleViewerMode],
  );

  return (
    <ViewerModeContext.Provider value={value}>{children}</ViewerModeContext.Provider>
  );
}
