// Typed localStorage wrapper.
//
// All app state is persisted in the browser. Access is funnelled through this module
// so keys, JSON (de)serialisation, schema versioning, and error handling live in one
// place. See DEVELOPMENT.md §4.
//
// Robustness: if localStorage is unavailable (SSR, Safari private mode, disabled
// storage) we transparently fall back to an in-memory store so the app keeps working
// for the current session. This also makes the wrapper unit-testable under Node.

export const STORAGE_PREFIX = 'wc26';
export const SCHEMA_VERSION = 1;

export const KEYS = {
  schemaVersion: `${STORAGE_PREFIX}.schemaVersion`,
  users: `${STORAGE_PREFIX}.users`,
  activeUserId: `${STORAGE_PREFIX}.activeUserId`,
  bets: `${STORAGE_PREFIX}.bets`,
  results: `${STORAGE_PREFIX}.results`,
  resultsSyncedAt: `${STORAGE_PREFIX}.resultsSyncedAt`,
} as const;

/** Minimal in-memory Storage implementation used as a fallback. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

let cached: Storage | undefined;

function storage(): Storage {
  if (cached) return cached;
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const probe = `${STORAGE_PREFIX}.__probe__`;
      globalThis.localStorage.setItem(probe, '1');
      globalThis.localStorage.removeItem(probe);
      cached = globalThis.localStorage;
      return cached;
    }
  } catch {
    // fall through to memory storage
  }
  cached = new MemoryStorage();
  return cached;
}

/** Read and JSON-parse a key, returning `fallback` if missing or corrupt. */
export function readJSON<T>(key: string, fallback: T): T {
  const raw = storage().getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-serialise and write a value. Returns `false` on quota/serialisation
 * errors (e.g. storage full) instead of throwing, so callers can keep running
 * with in-memory state. The most recent failure is recorded for the UI to
 * surface via {@link getLastStorageError}. */
export function writeJSON<T>(key: string, value: T): boolean {
  try {
    storage().setItem(key, JSON.stringify(value));
    lastStorageError = null;
    return true;
  } catch (err) {
    lastStorageError = err instanceof Error ? err.message : String(err);
    if (typeof console !== 'undefined') {
      console.warn(`wc26: failed to persist "${key}" — ${lastStorageError}`);
    }
    return false;
  }
}

let lastStorageError: string | null = null;

/** The message of the most recent failed write, or `null` if the last write
 * succeeded. Lets the UI warn the user that changes may not persist. */
export function getLastStorageError(): string | null {
  return lastStorageError;
}

export function removeKey(key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    // ignore
  }
}

/** Remove all keys owned by this app. */
export function clearAll(): void {
  for (const key of Object.values(KEYS)) removeKey(key);
}

/** Ensure the persisted schema version is recorded; placeholder for future migrations. */
export function ensureSchemaVersion(): void {
  const current = readJSON<number | null>(KEYS.schemaVersion, null);
  if (current === null) {
    writeJSON(KEYS.schemaVersion, SCHEMA_VERSION);
  }
  // Future: if (current < SCHEMA_VERSION) migrate(...) then bump.
}

/** Test-only: reset the cached storage handle (and memory store). */
export function __resetStorageForTests(): void {
  cached = undefined;
}
