import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { matches, getMatch } from '../data';
import { computeBracket } from '../domain/bracket';
import { useResults } from './ResultsContext';
import { BracketContext, type BracketContextValue, type MatchRefs } from './BracketContext';

export function BracketProvider({ children }: { children: ReactNode }) {
  const { results } = useResults();

  const resolved = useMemo(() => computeBracket(matches, results), [results]);

  const getRefs = useCallback(
    (matchId: string): MatchRefs => {
      const r = resolved[matchId];
      if (r) return r;
      const m = getMatch(matchId);
      return { home: m!.home, away: m!.away };
    },
    [resolved],
  );

  const value = useMemo<BracketContextValue>(() => ({ getRefs }), [getRefs]);

  return <BracketContext.Provider value={value}>{children}</BracketContext.Provider>;
}
