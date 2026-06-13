import { createContext, useContext } from 'react';

export interface ViewerModeContextValue {
  /** Whether the app is currently in (non-user-specific) viewer mode. */
  viewerMode: boolean;
  /** Enable or disable viewer mode explicitly. */
  setViewerMode: (on: boolean) => void;
  /** Flip viewer mode on/off. */
  toggleViewerMode: () => void;
}

export const ViewerModeContext = createContext<ViewerModeContextValue | null>(null);

export function useViewerMode(): ViewerModeContextValue {
  const ctx = useContext(ViewerModeContext);
  if (!ctx) throw new Error('useViewerMode must be used within a ViewerModeProvider');
  return ctx;
}
