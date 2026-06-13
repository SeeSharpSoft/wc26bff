import { createContext, useContext } from 'react';
import type { Result } from '../types';
import type { ResultsByMatch } from '../storage/results';

export type SyncStatus = 'idle' | 'loading' | 'error';

export interface ResultsContextValue {
  /** Map of matchId -> official result (synced or seeded from bundled data). */
  results: ResultsByMatch;
  /** Convenience accessor for a single match's result. */
  getResult: (matchId: string) => Result | undefined;
  /** Current sync status. */
  status: SyncStatus;
  /** Error message from the last failed sync, if any. */
  error: string | null;
  /** ISO timestamp of the last successful sync, or null if never synced. */
  lastSyncedAt: string | null;
  /** Trigger an on-demand sync from the trusted source. */
  sync: () => Promise<void>;
}

export const ResultsContext = createContext<ResultsContextValue | null>(null);

export function useResults(): ResultsContextValue {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error('useResults must be used within a ResultsProvider');
  return ctx;
}
