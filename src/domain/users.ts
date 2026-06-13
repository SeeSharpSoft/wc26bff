// Pure, side-effect-free user logic. Unit-testable without React or storage.
// Persistence lives in src/storage; React glue lives in src/context.

import type { User } from '../types';

export interface UserFactoryDeps {
  /** Returns a unique id. Injectable for deterministic tests. */
  id?: () => string;
  /** Returns an ISO timestamp. Injectable for deterministic tests. */
  now?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `u_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function defaultNow(): string {
  return new Date().toISOString();
}

/** Maximum length of a user's display name. */
export const MAX_USER_NAME_LENGTH = 10;

/** Build a new user from a display name. Throws on an empty/blank name. */
export function makeUser(name: string, deps: UserFactoryDeps = {}): User {
  const trimmed = name.trim().slice(0, MAX_USER_NAME_LENGTH);
  if (!trimmed) throw new Error('User name must not be empty');
  return {
    id: (deps.id ?? defaultId)(),
    name: trimmed,
    createdAt: (deps.now ?? defaultNow)(),
  };
}

/** Append a new user; returns the updated list and the created user. */
export function addUser(
  users: User[],
  name: string,
  deps: UserFactoryDeps = {},
): { users: User[]; user: User } {
  const user = makeUser(name, deps);
  return { users: [...users, user], user };
}

/** Remove a user by id. */
export function removeUser(users: User[], id: string): User[] {
  return users.filter((u) => u.id !== id);
}

/** Rename a user by id. Throws on an empty/blank name. */
export function renameUser(users: User[], id: string, name: string): User[] {
  const trimmed = name.trim().slice(0, MAX_USER_NAME_LENGTH);
  if (!trimmed) throw new Error('User name must not be empty');
  return users.map((u) => (u.id === id ? { ...u, name: trimmed } : u));
}

/**
 * Decide which user should be active: keep the current one if it still exists,
 * otherwise fall back to the first user, or null when there are none.
 */
export function resolveActiveUserId(
  users: User[],
  currentActiveId: string | null,
): string | null {
  if (currentActiveId && users.some((u) => u.id === currentActiveId)) {
    return currentActiveId;
  }
  return users[0]?.id ?? null;
}
