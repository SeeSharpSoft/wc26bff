// Persistence accessors for bets.

import { KEYS, readJSON, writeJSON } from './localStorage';
import type { BetsByUser } from '../domain/bets';

export function loadBets(): BetsByUser {
  const bets = readJSON<BetsByUser>(KEYS.bets, {});
  return bets && typeof bets === 'object' && !Array.isArray(bets) ? bets : {};
}

export function saveBets(bets: BetsByUser): void {
  writeJSON(KEYS.bets, bets);
}
