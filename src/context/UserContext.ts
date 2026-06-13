import { createContext, useContext } from 'react';
import type { User } from '../types';

export interface UserContextValue {
  users: User[];
  activeUserId: string | null;
  activeUser: User | null;
  /** Create a user from a display name and return it. */
  addUser: (name: string) => User;
  removeUser: (id: string) => void;
  renameUser: (id: string, name: string) => void;
  /** Set the active user (whose private bets are shown). */
  switchUser: (id: string) => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
