import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { getDevNow, getDevNowIso, resolveNow, setDevNow } from '../../src/utils/devClock';

// devClock reads/writes globalThis.localStorage directly. Under the Node test
// environment there is none, so install a minimal stub for these tests.
class FakeStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const g = globalThis as unknown as { localStorage?: unknown };

beforeEach(() => {
  g.localStorage = new FakeStorage();
});

afterEach(() => {
  delete g.localStorage;
});

describe('devClock', () => {
  it('returns null when no override is set', () => {
    expect(getDevNow()).toBeNull();
    expect(getDevNowIso()).toBeNull();
  });

  it('resolveNow falls back to the real clock without an override', () => {
    expect(resolveNow(1234)).toBe(1234);
  });

  it('stores and resolves an override instant', () => {
    setDevNow('2026-06-15T12:00:00.000Z');
    const expected = Date.parse('2026-06-15T12:00:00.000Z');
    expect(getDevNow()).toBe(expected);
    expect(getDevNowIso()).toBe('2026-06-15T12:00:00.000Z');
    expect(resolveNow(1234)).toBe(expected);
  });

  it('clears the override', () => {
    setDevNow('2026-06-15T12:00:00.000Z');
    setDevNow(null);
    expect(getDevNow()).toBeNull();
    expect(resolveNow(1234)).toBe(1234);
  });

  it('ignores a corrupt stored value', () => {
    g.localStorage = new FakeStorage();
    (g.localStorage as FakeStorage).setItem('wc26.devNow', '"not-a-date"');
    expect(getDevNow()).toBeNull();
  });
});
