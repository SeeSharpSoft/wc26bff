import type { Match, TeamRef } from '../types';
import { flagUrl, getTeam, teamRefLabel } from '../data';
import { formatDateTime, localTimeZoneLabel } from '../utils/time';
import { isMatchStarted } from '../utils/locking';
import { useNow } from '../hooks/useNow';
import { BetInput } from './BetInput';
import './MatchCard.css';

function Participant({ side, teamRef }: { side: 'home' | 'away'; teamRef: TeamRef }) {
  const team = teamRef.kind === 'team' ? getTeam(teamRef.teamId) : undefined;
  return (
    <span className={`participant participant-${side}`}>
      {team ? (
        <>
          <img className="flag" src={flagUrl(team)} alt="" width={22} height={15} />
          <span className="participant-name">{team.name}</span>
        </>
      ) : (
        <span className="participant-name placeholder">{teamRefLabel(teamRef)}</span>
      )}
    </span>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const now = useNow();
  const started = isMatchStarted(match, now);
  const result = match.officialResult;

  return (
    <article className="match-card" data-testid={`match-${match.id}`}>
      <div className="match-card-meta">
        <span className="match-round">{match.roundLabel}</span>
        <span className="match-kickoff">
          {formatDateTime(match.kickoff)} {localTimeZoneLabel(match.kickoff)}
        </span>
      </div>

      <div className="match-card-teams">
        <Participant side="home" teamRef={match.home} />
        <span className="match-score" data-testid={`result-${match.id}`}>
          {result ? (
            <strong>
              {result.homeGoals}–{result.awayGoals}
            </strong>
          ) : started ? (
            <span className="badge badge-live">LIVE</span>
          ) : (
            <span className="vs">v</span>
          )}
        </span>
        <Participant side="away" teamRef={match.away} />
      </div>

      <BetInput match={match} />
    </article>
  );
}
