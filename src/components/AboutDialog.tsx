import { useEffect, useRef } from 'react';
import { IconClose, IconExternalLink } from './icons';
import './AboutDialog.css';

const REPO_URL = 'https://github.com/SeeSharpSoft/wc26bff';

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape; focus the dialog for keyboard users.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="about-overlay"
      data-testid="about-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="about-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        data-testid="about-dialog"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button
          type="button"
          className="about-close"
          data-testid="about-close"
          aria-label="Close"
          onClick={onClose}
        >
          <IconClose />
        </button>

        <h2 id="about-title" className="about-title">
          <span className="about-mark" aria-hidden="true">
            ⚽
          </span>
          World Cup 2026 — Friends Betting
        </h2>

        <p>
          Predict the outcome of every <strong>FIFA World Cup 2026</strong> match. Pick a
          scoreline for each game and lock in your guess before kickoff — once a match
          starts, bets are final.
        </p>
        <p>
          Several friends can share the same browser: switch between users, and everyone
          keeps their own private guesses. In <strong>viewer mode</strong> you can compare
          everyone's bets against the real results once a match has started. A correct exact
          score is worth <strong>3 points</strong>, the right tendency (win / draw / loss) is
          worth <strong>1 point</strong>.
        </p>
        <p className="about-note">
          Everything is stored <strong>in your browser</strong> — there is no account and no
          server. To bring in the actual match results (including live scores while a game is
          on), use <strong>Sync results</strong> in the menu; viewer mode also refreshes them
          automatically. That is the only action that needs an internet connection.
        </p>

        <a
          className="about-repo"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="about-repo-link"
        >
          <IconExternalLink />
          View the project on GitHub
        </a>
      </div>
    </div>
  );
}
