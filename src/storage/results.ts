// Persistence accessors for synced results.

import { KEYS, readJSON, writeJSON } from './localStorage';
import { sanitizeResults } from './validation';
import type { Result } from '../types';

export type ResultsByMatch = Record<string, Result>;

export function loadResults(): ResultsByMatch {
  return sanitizeResults(readJSON<unknown>(KEYS.results, {}));
}

export function saveResults(results: ResultsByMatch): void {
  writeJSON(KEYS.results, results);
}

export function loadLastSyncedAt(): string | null {
  return readJSON<string | null>(KEYS.resultsSyncedAt, null);
}

export function saveLastSyncedAt(iso: string | null): void {
  writeJSON(KEYS.resultsSyncedAt, iso);
}
