import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  addUser,
  makeUser,
  removeUser,
  renameUser,
  resolveActiveUserId,
} from '../../src/domain/users';
import type { User } from '../../src/types';

let seq = 0;
const deps = {
  id: () => `id-${++seq}`,
  now: () => '2026-06-12T00:00:00.000Z',
};

beforeEach(() => {
  seq = 0;
});

describe('makeUser', () => {
  it('trims the name and assigns id + createdAt', () => {
    const u = makeUser('  Alice  ', deps);
    expect(u).toEqual({ id: 'id-1', name: 'Alice', createdAt: '2026-06-12T00:00:00.000Z' });
  });

  it('throws on a blank name', () => {
    expect(() => makeUser('   ')).toThrow();
    expect(() => makeUser('')).toThrow();
  });

  it('generates unique ids by default', () => {
    const a = makeUser('A');
    const b = makeUser('B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('addUser', () => {
  it('appends a new user immutably', () => {
    const before: User[] = [];
    const { users, user } = addUser(before, 'Bob', deps);
    expect(before).toHaveLength(0);
    expect(users).toHaveLength(1);
    expect(users[0]).toBe(user);
    expect(user.name).toBe('Bob');
  });
});

describe('removeUser', () => {
  it('removes by id and leaves others', () => {
    const users = [
      { id: 'a', name: 'A', createdAt: 'x' },
      { id: 'b', name: 'B', createdAt: 'x' },
    ];
    expect(removeUser(users, 'a')).toEqual([{ id: 'b', name: 'B', createdAt: 'x' }]);
  });

  it('is a no-op for an unknown id', () => {
    const users = [{ id: 'a', name: 'A', createdAt: 'x' }];
    expect(removeUser(users, 'z')).toEqual(users);
  });
});

describe('renameUser', () => {
  it('renames the matching user and trims', () => {
    const users = [{ id: 'a', name: 'A', createdAt: 'x' }];
    expect(renameUser(users, 'a', '  Z ')[0].name).toBe('Z');
  });

  it('throws on a blank name', () => {
    const users = [{ id: 'a', name: 'A', createdAt: 'x' }];
    expect(() => renameUser(users, 'a', '  ')).toThrow();
  });
});

describe('resolveActiveUserId', () => {
  const users = [
    { id: 'a', name: 'A', createdAt: 'x' },
    { id: 'b', name: 'B', createdAt: 'x' },
  ];

  it('keeps the current active user when it still exists', () => {
    expect(resolveActiveUserId(users, 'b')).toBe('b');
  });

  it('falls back to the first user when current is gone', () => {
    expect(resolveActiveUserId(users, 'gone')).toBe('a');
  });

  it('returns null when there are no users', () => {
    expect(resolveActiveUserId([], 'a')).toBeNull();
  });
});
