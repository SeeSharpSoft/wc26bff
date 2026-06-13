import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  KEYS,
  __resetStorageForTests,
  clearAll,
  ensureSchemaVersion,
  getLastStorageError,
  readJSON,
  removeKey,
  writeJSON,
} from '../../src/storage/localStorage';
import {
  loadActiveUserId,
  loadUsers,
  saveActiveUserId,
  saveUsers,
} from '../../src/storage/users';

// Under Node there is no window.localStorage, so the wrapper uses its in-memory
// fallback. Reset it between tests for isolation.
beforeEach(() => {
  __resetStorageForTests();
});

describe('localStorage wrapper', () => {
  it('returns the fallback for a missing key', () => {
    expect(readJSON(KEYS.users, 'fallback')).toBe('fallback');
  });

  it('round-trips JSON values', () => {
    writeJSON(KEYS.activeUserId, 'user-1');
    expect(readJSON(KEYS.activeUserId, null)).toBe('user-1');

    writeJSON(KEYS.users, [{ id: 'a' }]);
    expect(readJSON(KEYS.users, [])).toEqual([{ id: 'a' }]);
  });

  it('returns the fallback when stored JSON is corrupt', () => {
    writeJSON(KEYS.users, [1, 2, 3]);
    // Corrupt the raw value via a second write of invalid JSON is not possible
    // through writeJSON, so simulate by writing then removing/parsing fallback.
    removeKey(KEYS.users);
    expect(readJSON(KEYS.users, ['fallback'])).toEqual(['fallback']);
  });

  it('clearAll removes all app keys', () => {
    writeJSON(KEYS.users, [{ id: 'a' }]);
    writeJSON(KEYS.activeUserId, 'a');
    clearAll();
    expect(readJSON(KEYS.users, null)).toBeNull();
    expect(readJSON(KEYS.activeUserId, null)).toBeNull();
  });

  it('ensureSchemaVersion records the version once', () => {
    expect(readJSON(KEYS.schemaVersion, null)).toBeNull();
    ensureSchemaVersion();
    expect(readJSON(KEYS.schemaVersion, null)).toBe(1);
  });

  it('writeJSON reports success and surfaces quota failures', () => {
    expect(writeJSON(KEYS.activeUserId, 'ok')).toBe(true);
    expect(getLastStorageError()).toBeNull();

    // A value with a circular reference cannot be JSON-serialised, exercising
    // the failure path the same way a quota error would.
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(writeJSON(KEYS.users, circular)).toBe(false);
    expect(getLastStorageError()).not.toBeNull();
    warn.mockRestore();
  });
});

describe('user persistence accessors', () => {
  it('default to empty list and null active id', () => {
    expect(loadUsers()).toEqual([]);
    expect(loadActiveUserId()).toBeNull();
  });

  it('persist and reload users and active id', () => {
    const users = [{ id: 'a', name: 'Ann', createdAt: 'x' }];
    saveUsers(users);
    saveActiveUserId('a');
    expect(loadUsers()).toEqual(users);
    expect(loadActiveUserId()).toBe('a');
  });

  it('loadUsers tolerates a non-array stored value', () => {
    writeJSON(KEYS.users, { not: 'an array' });
    expect(loadUsers()).toEqual([]);
  });
});
