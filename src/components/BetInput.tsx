import { useId, useState } from 'react';
import type { Match } from '../types';
import { useBets } from '../context/BetsContext';
import { useUser } from '../context/UserContext';
import { isBetLocked } from '../utils/locking';
import { useNow } from '../hooks/useNow';

function parseGoals(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function BetInput({ match }: { match: Match }) {
  const { activeUser } = useUser();
  const now = useNow();
  const locked = isBetLocked(match, now);

  if (!activeUser) {
    return (
      <p className="bet-hint" data-testid={`bet-hint-${match.id}`}>
        Add or select a user to place a bet.
      </p>
    );
  }

  // Remount the editor when the active user changes so the draft inputs reset
  // to the newly selected user's stored bet instead of leaking across users.
  return locked ? (
    <LockedBet match={match} />
  ) : (
    <BetEditor key={activeUser.id} match={match} />
  );
}

function LockedBet({ match }: { match: Match }) {
  const { getBet } = useBets();
  const existing = getBet(match.id);
  return (
    <div className="bet-locked" data-testid={`locked-${match.id}`}>
      <span className="lock-icon" aria-hidden="true">
        🔒
      </span>
      {existing ? (
        <span data-testid={`bet-readonly-${match.id}`}>
          Your bet: <strong>{existing.homeGoals}</strong>–
          <strong>{existing.awayGoals}</strong>
        </span>
      ) : (
        <span>No bet placed — locked</span>
      )}
    </div>
  );
}

function BetEditor({ match }: { match: Match }) {
  const { getBet, setBet, clearBet } = useBets();
  const baseId = useId();
  const existing = getBet(match.id);

  const [home, setHome] = useState(existing ? String(existing.homeGoals) : '');
  const [away, setAway] = useState(existing ? String(existing.awayGoals) : '');

  function commit(nextHome: string, nextAway: string) {
    const h = parseGoals(nextHome);
    const a = parseGoals(nextAway);
    if (nextHome.trim() === '' && nextAway.trim() === '') {
      clearBet(match.id);
      return;
    }
    if (h !== null && a !== null) {
      setBet(match.id, h, a);
    }
  }

  return (
    <div className="bet-input" data-testid={`bet-${match.id}`}>
      <label className="visually-hidden" htmlFor={`${baseId}-home`}>
        Home goals
      </label>
      <input
        id={`${baseId}-home`}
        data-testid={`bet-home-${match.id}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={home}
        onChange={(e) => {
          setHome(e.target.value);
          commit(e.target.value, away);
        }}
      />
      <span className="bet-colon">:</span>
      <label className="visually-hidden" htmlFor={`${baseId}-away`}>
        Away goals
      </label>
      <input
        id={`${baseId}-away`}
        data-testid={`bet-away-${match.id}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={away}
        onChange={(e) => {
          setAway(e.target.value);
          commit(home, e.target.value);
        }}
      />
    </div>
  );
}
