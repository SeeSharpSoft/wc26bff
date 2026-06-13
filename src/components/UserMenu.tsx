import { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useResults } from '../context/ResultsContext';
import { formatDateTime } from '../utils/time';
import {
  IconChevron,
  IconPlus,
  IconSync,
  IconTrash,
  IconUser,
  IconUsers,
} from './icons';
import './UserMenu.css';

export function UserMenu() {
  const { users, activeUserId, activeUser, addUser, removeUser, switchUser } = useUser();
  const { status, error, lastSyncedAt, sync } = useResults();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape for a natural popup feel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function handleSwitch(id: string) {
    switchUser(id);
    setOpen(false);
  }

  function handleDelete(id: string) {
    removeUser(id);
    setOpen(false);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const user = addUser(trimmed);
    switchUser(user.id);
    setName('');
    setOpen(false);
  }

  function handleSync() {
    void sync();
    setOpen(false);
  }

  const loading = status === 'loading';

  return (
    <div className="user-menu" data-testid="user-menu-root" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        data-testid="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-menu-avatar" aria-hidden="true">
          {activeUser ? <IconUser /> : <IconUsers />}
        </span>
        {activeUser ? (
          <span className="active-user" data-testid="active-user">
            {activeUser.name}
          </span>
        ) : (
          <span className="no-users" data-testid="no-users">
            No users yet
          </span>
        )}
        <span className="user-menu-caret" aria-hidden="true">
          <IconChevron />
        </span>
      </button>

      {open && (
        <div className="user-menu-popup" role="menu" data-testid="user-menu">
          <p className="user-menu-heading">Switch user</p>

          {users.length > 0 ? (
            <ul className="user-menu-list">
              {users.map((u) => {
                const isActive = u.id === activeUserId;
                return (
                  <li key={u.id} className="user-menu-item">
                    <button
                      type="button"
                      className={`user-menu-name${isActive ? ' is-active' : ''}`}
                      data-testid={`select-user-${u.id}`}
                      aria-current={isActive}
                      onClick={() => handleSwitch(u.id)}
                    >
                      <span className="user-menu-name-icon" aria-hidden="true">
                        <IconUser />
                      </span>
                      <span className="user-menu-name-text">{u.name}</span>
                      {isActive && (
                        <span className="user-menu-active-tag" aria-hidden="true">
                          active
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="user-menu-delete"
                      data-testid={`delete-user-${u.id}`}
                      title={`Delete ${u.name}`}
                      aria-label={`Delete ${u.name}`}
                      onClick={() => handleDelete(u.id)}
                    >
                      <IconTrash />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="user-menu-empty" data-testid="user-menu-empty">
              No users yet — add one below to start betting.
            </p>
          )}

          <form className="user-menu-add" onSubmit={handleAdd}>
            <input
              type="text"
              data-testid="new-user-input"
              placeholder="New user name"
              value={name}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              className="user-menu-add-btn"
              data-testid="add-user-btn"
              disabled={!name.trim()}
              aria-label="Add user"
              title="Add user"
            >
              <IconPlus />
            </button>
          </form>

          <div className="user-menu-divider" role="separator" />

          <div className="user-menu-sync">
            <button
              type="button"
              className="user-menu-sync-btn"
              data-testid="sync-btn"
              onClick={handleSync}
              disabled={loading}
            >
              <span className={`user-menu-sync-icon${loading ? ' spinning' : ''}`} aria-hidden="true">
                <IconSync />
              </span>
              {loading ? 'Syncing…' : 'Sync results'}
            </button>
            <span className="user-menu-sync-status" data-testid="sync-status">
              {status === 'error' ? (
                <span className="user-menu-sync-error" data-testid="sync-error">
                  Sync failed: {error}
                </span>
              ) : lastSyncedAt ? (
                <>Synced {formatDateTime(lastSyncedAt)}</>
              ) : (
                'Not synced yet'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
