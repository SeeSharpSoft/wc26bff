// Date/time display helpers.
//
// GUIDANCE: all timestamps are stored as ISO-8601 UTC strings, but anything shown
// to the user MUST be rendered in the browser's local timezone. Always format dates
// through these helpers (which omit `timeZone`, so the runtime uses the local zone)
// rather than calling toLocale*/Intl with a fixed `timeZone`. See DEVELOPMENT.md §7.

/** The browser's resolved local IANA timezone, e.g. "Europe/Berlin". */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Short timezone abbreviation for the given instant in the local zone, e.g. "EDT". */
export function localTimeZoneLabel(iso: string): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZoneName: 'short',
  }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
}

/** Date + time in the browser's local timezone, e.g. "11 Jun 2026, 15:00". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Date only, in the browser's local timezone, e.g. "Thu, 11 Jun 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Time only, in the browser's local timezone, e.g. "15:00". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
