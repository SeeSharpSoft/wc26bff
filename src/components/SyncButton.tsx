import { useResults } from '../context/ResultsContext';
import { formatDateTime } from '../utils/time';
import './SyncButton.css';

export function SyncButton() {
  const { status, error, lastSyncedAt, sync } = useResults();
  const loading = status === 'loading';

  return (
    <div className="sync" data-testid="sync">
      <button
        type="button"
        className="sync-btn"
        data-testid="sync-btn"
        onClick={() => void sync()}
        disabled={loading}
      >
        {loading ? 'Syncing…' : 'Sync results'}
      </button>
      <span className="sync-status" data-testid="sync-status">
        {status === 'error' ? (
          <span className="sync-error" data-testid="sync-error">
            Sync failed: {error}
          </span>
        ) : lastSyncedAt ? (
          <>Synced {formatDateTime(lastSyncedAt)}</>
        ) : (
          'Not synced yet'
        )}
      </span>
    </div>
  );
}
