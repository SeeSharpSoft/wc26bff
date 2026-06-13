import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  clearBet as clearBetPure,
  getBet as getBetPure,
  setBet as setBetPure,
  type BetsByUser,
} from '../domain/bets';
import { loadBets, saveBets } from '../storage/bets';
import { useUser } from './UserContext';
import { BetsContext, type BetsContextValue } from './BetsContext';

export function BetsProvider({ children }: { children: ReactNode }) {
  const { activeUserId } = useUser();
  const [allBets, setAllBets] = useState<BetsByUser>(() => loadBets());

  useEffect(() => {
    saveBets(allBets);
  }, [allBets]);

  const getBet = useCallback(
    (matchId: string) =>
      activeUserId ? getBetPure(allBets, activeUserId, matchId) : undefined,
    [allBets, activeUserId],
  );

  const setBet = useCallback(
    (matchId: string, homeGoals: number, awayGoals: number) => {
      if (!activeUserId) return;
      setAllBets((prev) => setBetPure(prev, activeUserId, matchId, homeGoals, awayGoals));
    },
    [activeUserId],
  );

  const clearBet = useCallback(
    (matchId: string) => {
      if (!activeUserId) return;
      setAllBets((prev) => clearBetPure(prev, activeUserId, matchId));
    },
    [activeUserId],
  );

  const value = useMemo<BetsContextValue>(
    () => ({ allBets, getBet, setBet, clearBet }),
    [allBets, getBet, setBet, clearBet],
  );

  return <BetsContext.Provider value={value}>{children}</BetsContext.Provider>;
}
