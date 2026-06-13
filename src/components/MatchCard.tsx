import type { Match, TeamRef } from '../types';
import { flagUrl, getTeam, teamRefLabel } from '../data';
import { formatDateTime, localTimeZoneLabel } from '../utils/time';
import { isMatchStarted } from '../utils/locking';
import { scoreBet } from '../utils/scoring';
import { useNow } from '../hooks/useNow';
import { useResults } from '../context/ResultsContext';
import { useBets } from '../context/BetsContext';
import { useBracket } from '../context/BracketContext';
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
  const { getResult } = useResults();
  const { getBet } = useBets();
  const { getRefs } = useBracket();
  const refs = getRefs(match.id);
  const started = isMatchStarted(match, now);
  const result = getResult(match.id);
  const finished = result?.status === 'finished';

  const bet = getBet(match.id);
  const points = finished && bet ? scoreBet(bet, result) : null;

  return (
    <article className="match-card" data-testid={`match-${match.id}`}>
      <div className="match-card-meta">
        <span className="match-round">{match.roundLabel}</span>
        <span className="match-kickoff">
          {formatDateTime(match.kickoff)} {localTimeZoneLabel(match.kickoff)}
        </span>
      </div>

      <div className="match-card-teams">
        <Participant side="home" teamRef={refs.home} />
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
        <Participant side="away" teamRef={refs.away} />
      </div>

      <BetInput match={match} />

      {points !== null && (
        <p
          className={`bet-points bet-points-${points}`}
          data-testid={`points-${match.id}`}
        >
          You scored <strong>{points}</strong> {points === 1 ? 'point' : 'points'}
        </p>
      )}
    </article>
  );
}
