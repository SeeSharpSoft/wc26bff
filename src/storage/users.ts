// Persistence accessors for users + the active-user selection.

import type { User } from '../types';
import { KEYS, readJSON, writeJSON } from './localStorage';
import { sanitizeUsers } from './validation';

export function loadUsers(): User[] {
  return sanitizeUsers(readJSON<unknown>(KEYS.users, []));
}

export function saveUsers(users: User[]): void {
  writeJSON(KEYS.users, users);
}

export function loadActiveUserId(): string | null {
  return readJSON<string | null>(KEYS.activeUserId, null);
}

export function saveActiveUserId(id: string | null): void {
  writeJSON(KEYS.activeUserId, id);
}
