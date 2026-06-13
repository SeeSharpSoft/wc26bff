import { useState } from 'react';
import { useUser } from '../context/UserContext';
import './UserSwitcher.css';

export function UserSwitcher() {
  const { users, activeUserId, activeUser, addUser, removeUser, switchUser } = useUser();
  const [name, setName] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const user = addUser(trimmed);
    switchUser(user.id);
    setName('');
  }

  function handleRemove() {
    if (!activeUser) return;
    const ok = window.confirm(
      `Remove user "${activeUser.name}"? Their bets will no longer be shown.`,
    );
    if (ok) removeUser(activeUser.id);
  }

  return (
    <div className="user-switcher" data-testid="user-switcher">
      {users.length > 0 ? (
        <div className="user-switcher-active">
          <label className="visually-hidden" htmlFor="user-select">
            Active user
          </label>
          <select
            id="user-select"
            data-testid="user-select"
            value={activeUserId ?? ''}
            onChange={(e) => switchUser(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <span className="active-user" data-testid="active-user">
            {activeUser?.name}
          </span>
          <button
            type="button"
            className="btn-ghost"
            data-testid="remove-user-btn"
            onClick={handleRemove}
            title="Remove active user"
          >
            ✕
          </button>
        </div>
      ) : (
        <span className="no-users" data-testid="no-users">
          No users yet — add one to start betting.
        </span>
      )}

      <form className="user-switcher-add" onSubmit={handleAdd}>
        <input
          type="text"
          data-testid="new-user-input"
          placeholder="New user name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" data-testid="add-user-btn" disabled={!name.trim()}>
          Add user
        </button>
      </form>
    </div>
  );
}
