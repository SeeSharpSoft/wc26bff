import { describe, expect, it } from '@jest/globals';
import {
  formatDate,
  formatDateTime,
  formatTime,
  localTimeZone,
  localTimeZoneLabel,
} from '../../src/utils/time';

// These helpers must format in the runtime's local timezone (no fixed timeZone).
// Tests pin the process timezone via TZ so results are deterministic.
const iso = '2026-06-11T19:00:00.000Z'; // 15:00 in America/New_York (EDT, UTC-4)

describe('time helpers (local timezone)', () => {
  it('reports the local IANA timezone from the runtime', () => {
    expect(localTimeZone()).toBe(process.env.TZ ?? localTimeZone());
  });

  it('formats time in the local zone, not UTC', () => {
    const localRef = new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });
    const utcRef = new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    if (process.env.TZ === 'America/New_York') {
      // 19:00 UTC === 15:00 (3 PM) EDT — must match local, must differ from UTC.
      expect(formatTime(iso)).toBe(localRef);
      expect(formatTime(iso)).not.toBe(utcRef);
      expect(localTimeZoneLabel(iso)).toBe('EDT');
    } else {
      expect(typeof formatTime(iso)).toBe('string');
    }
  });

  it('formatDateTime includes the date and a time', () => {
    const out = formatDateTime(iso);
    expect(out).toContain('2026');
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formatDate includes year, month and day', () => {
    const out = formatDate(iso);
    expect(out).toContain('2026');
    expect(out).toMatch(/Jun/i);
  });

  it('localTimeZoneLabel returns a non-empty abbreviation', () => {
    expect(localTimeZoneLabel(iso).length).toBeGreaterThan(0);
  });
});
