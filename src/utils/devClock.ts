// Developer-only clock override.
//
// For manual + automated testing of kickoff locking it is useful to pretend the
// current time is some fixed instant (e.g. just before / after a match starts).
// When an override is set, `useNow()` returns it instead of the real wall clock.
// The override is stored in localStorage so it survives reloads, and a custom
// event lets open components react immediately when it changes.
//
// This is a development aid only — the UI control is gated on `import.meta.env.DEV`
// and is never shown in production builds. See DEVELOPMENT.md §7.

export const DEV_NOW_KEY = 'wc26.devNow';
export const DEV_NOW_EVENT = 'wc26:devnow';

function store(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' ? (globalThis.localStorage ?? null) : null;
  } catch {
    return null;
  }
}

/** The override instant in epoch ms, or `null` when no override is active. */
export function getDevNow(): number | null {
  const raw = store()?.getItem(DEV_NOW_KEY) ?? null;
  if (raw === null) return null;
  try {
    const iso = JSON.parse(raw) as unknown;
    if (typeof iso !== 'string') return null;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

/** The override as an ISO string, or `null` when inactive. */
export function getDevNowIso(): string | null {
  const ms = getDevNow();
  return ms === null ? null : new Date(ms).toISOString();
}

/** Set (or, with `null`, clear) the override and notify open components. */
export function setDevNow(iso: string | null): void {
  const s = store();
  try {
    if (iso === null) s?.removeItem(DEV_NOW_KEY);
    else s?.setItem(DEV_NOW_KEY, JSON.stringify(iso));
  } catch {
    // ignore (storage unavailable)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEV_NOW_EVENT));
  }
}

/** Resolve "now": the override if active, otherwise the supplied real clock. */
export function resolveNow(realNowMs: number = Date.now()): number {
  return getDevNow() ?? realNowMs;
}
