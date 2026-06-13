import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Result } from '../types';
import { matches } from '../data';
import {
  loadLastSyncedAt,
  loadResults,
  saveLastSyncedAt,
  saveResults,
  type ResultsByMatch,
} from '../storage/results';
import { syncResults } from '../services/resultsSync';
import { ResultsContext, type ResultsContextValue, type SyncStatus } from './ResultsContext';

/** Seed results from scores baked into the bundled dataset (already-played matches). */
function seedFromBundled(): ResultsByMatch {
  const seeded: ResultsByMatch = {};
  for (const m of matches) {
    if (m.officialResult) {
      seeded[m.id] = {
        matchId: m.id,
        homeGoals: m.officialResult.homeGoals,
        awayGoals: m.officialResult.awayGoals,
        status: 'finished',
      };
    }
  }
  return seeded;
}

function initialResults(): ResultsByMatch {
  const stored = loadResults();
  return Object.keys(stored).length > 0 ? stored : seedFromBundled();
}

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ResultsByMatch>(initialResults);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    loadLastSyncedAt(),
  );
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveResults(results);
  }, [results]);

  useEffect(() => {
    saveLastSyncedAt(lastSyncedAt);
  }, [lastSyncedAt]);

  const getResult = useCallback(
    (matchId: string): Result | undefined => results[matchId],
    [results],
  );

  const sync = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const fetched = await syncResults();
      setResults((prev) => ({ ...prev, ...fetched }));
      setLastSyncedAt(new Date().toISOString());
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      setStatus('error');
    }
  }, []);

  const value = useMemo<ResultsContextValue>(
    () => ({ results, getResult, status, error, lastSyncedAt, sync }),
    [results, getResult, status, error, lastSyncedAt, sync],
  );

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>;
}
