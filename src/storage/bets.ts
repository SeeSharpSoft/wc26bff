// Persistence accessors for bets.

import { KEYS, readJSON, writeJSON } from './localStorage';
import { sanitizeBets } from './validation';
import type { BetsByUser } from '../domain/bets';

export function loadBets(): BetsByUser {
  return sanitizeBets(readJSON<unknown>(KEYS.bets, {}));
}

export function saveBets(bets: BetsByUser): void {
  writeJSON(KEYS.bets, bets);
}
