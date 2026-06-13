import { createContext, useContext } from 'react';
import type { Bet } from '../types';
import type { BetsByUser } from '../domain/bets';

export interface BetsContextValue {
  /** All bets for all users (used by viewer mode). */
  allBets: BetsByUser;
  /** Get the active user's bet for a match. */
  getBet: (matchId: string) => Bet | undefined;
  /** Upsert the active user's bet for a match. No-op if there is no active user. */
  setBet: (matchId: string, homeGoals: number, awayGoals: number) => void;
  /** Remove the active user's bet for a match. */
  clearBet: (matchId: string) => void;
}

export const BetsContext = createContext<BetsContextValue | null>(null);

export function useBets(): BetsContextValue {
  const ctx = useContext(BetsContext);
  if (!ctx) throw new Error('useBets must be used within a BetsProvider');
  return ctx;
}
