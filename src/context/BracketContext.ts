import { createContext, useContext } from 'react';
import type { TeamRef } from '../types';

export interface MatchRefs {
  home: TeamRef;
  away: TeamRef;
}

export interface BracketContextValue {
  /**
   * Resolved home/away refs for a match. Group matches return their concrete
   * teams; knockout matches return resolved teams where the tournament has
   * progressed far enough, otherwise the original placeholders.
   */
  getRefs: (matchId: string) => MatchRefs;
}

export const BracketContext = createContext<BracketContextValue | null>(null);

export function useBracket(): BracketContextValue {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error('useBracket must be used within a BracketProvider');
  return ctx;
}
