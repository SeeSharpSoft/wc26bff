import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { ensureSchemaVersion } from '../storage/localStorage';
import {
  loadActiveUserId,
  loadUsers,
  saveActiveUserId,
  saveUsers,
} from '../storage/users';
import {
  makeUser,
  removeUser as removeUserPure,
  renameUser as renameUserPure,
  resolveActiveUserId,
} from '../domain/users';
import { UserContext, type UserContextValue } from './UserContext';

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadUsers());
  // The user's explicit selection. May be stale (e.g. after a removal) or null;
  // the effective active id is always derived via resolveActiveUserId below.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() =>
    loadActiveUserId(),
  );

  const activeUserId = useMemo(
    () => resolveActiveUserId(users, selectedUserId),
    [users, selectedUserId],
  );

  useEffect(() => {
    ensureSchemaVersion();
  }, []);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveActiveUserId(activeUserId);
  }, [activeUserId]);

  const addUser = useCallback((name: string): User => {
    const user = makeUser(name);
    setUsers((prev) => [...prev, user]);
    return user;
  }, []);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => removeUserPure(prev, id));
  }, []);

  const renameUser = useCallback((id: string, name: string) => {
    setUsers((prev) => renameUserPure(prev, id, name));
  }, []);

  const switchUser = useCallback((id: string) => {
    setSelectedUserId(id);
  }, []);

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) ?? null,
    [users, activeUserId],
  );

  const value = useMemo<UserContextValue>(
    () => ({ users, activeUserId, activeUser, addUser, removeUser, renameUser, switchUser }),
    [users, activeUserId, activeUser, addUser, removeUser, renameUser, switchUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
