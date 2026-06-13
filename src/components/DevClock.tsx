import { useState } from 'react';
import { useNow } from '../hooks/useNow';
import { getDevNowIso, setDevNow } from '../utils/devClock';
import { formatDateTime } from '../utils/time';
import './DevClock.css';

/**
 * Developer-only control to override "now" for testing kickoff locking.
 * Rendered only in dev builds (gated by the caller on `import.meta.env.DEV`).
 */
export function DevClock() {
  const now = useNow();
  const active = getDevNowIso() !== null;
  const [draft, setDraft] = useState('');

  function apply() {
    if (!draft) return;
    const ms = Date.parse(draft);
    if (Number.isNaN(ms)) return;
    setDevNow(new Date(ms).toISOString());
  }

  return (
    <details className="dev-clock" data-testid="dev-clock">
      <summary>
        🕑 {active ? 'Time overridden' : 'Dev clock'}
      </summary>
      <div className="dev-clock-body">
        <p className="dev-clock-now" data-testid="dev-clock-now">
          Now: {formatDateTime(new Date(now).toISOString())}
          {active ? ' (override)' : ' (live)'}
        </p>
        <label>
          Override (local time)
          <input
            type="datetime-local"
            value={draft}
            data-testid="dev-clock-input"
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <div className="dev-clock-actions">
          <button type="button" onClick={apply} data-testid="dev-clock-apply">
            Set
          </button>
          <button
            type="button"
            onClick={() => setDevNow(null)}
            data-testid="dev-clock-clear"
            disabled={!active}
          >
            Use live clock
          </button>
        </div>
      </div>
    </details>
  );
}
