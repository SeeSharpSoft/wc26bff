import type { Match, TeamRef } from '../types';
import { groups, getMatchesByGroup, getTeam, flagUrl, teamRefLabel } from '../data';
import { formatDateTime, localTimeZoneLabel } from '../utils/time';
import { isMatchStarted } from '../utils/locking';
import { scoreBet } from '../utils/scoring';
import { getBet } from '../domain/bets';
import { useNow } from '../hooks/useNow';
import { useUser } from '../context/UserContext';
import { useBets } from '../context/BetsContext';
import { useResults } from '../context/ResultsContext';
import { Leaderboard } from '../components/Leaderboard';
import './ViewerPage.css';

function teamLabel(ref: TeamRef): string {
  if (ref.kind !== 'team') return teamRefLabel(ref);
  return getTeam(ref.teamId)?.name ?? ref.teamId;
}

function TeamName({ teamRef }: { teamRef: TeamRef }) {
  const team = teamRef.kind === 'team' ? getTeam(teamRef.teamId) : undefined;
  return (
    <span className="viewer-team">
      {team && <img className="flag" src={flagUrl(team)} alt="" width={20} height={14} />}
      {teamLabel(teamRef)}
    </span>
  );
}

function ViewerMatch({ match }: { match: Match }) {
  const now = useNow();
  const { users } = useUser();
  const { allBets } = useBets();
  const { getResult } = useResults();

  const started = isMatchStarted(match, now);
  const result = getResult(match.id);
  const finished = result?.status === 'finished';

  return (
    <article className="viewer-match" data-testid={`viewer-match-${match.id}`}>
      <div className="viewer-match-head">
        <span className="viewer-fixture">
          <TeamName teamRef={match.home} />
          <span className="viewer-score" data-testid={`viewer-result-${match.id}`}>
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
          <TeamName teamRef={match.away} />
        </span>
        <span className="viewer-kickoff">
          {formatDateTime(match.kickoff)} {localTimeZoneLabel(match.kickoff)}
        </span>
      </div>

      {!started ? (
        <p className="viewer-hidden" data-testid={`viewer-hidden-${match.id}`}>
          🔒 Bets are hidden until kickoff.
        </p>
      ) : users.length === 0 ? (
        <p className="viewer-hidden">No users yet.</p>
      ) : (
        <ul className="viewer-bets" data-testid={`viewer-bets-${match.id}`}>
          {users.map((user) => {
            const bet = getBet(allBets, user.id, match.id);
            const points = finished && bet ? scoreBet(bet, result) : null;
            return (
              <li key={user.id} data-testid={`viewer-bet-${match.id}-${user.id}`}>
                <span className="viewer-bet-user">{user.name}</span>
                <span className="viewer-bet-score">
                  {bet ? `${bet.homeGoals}–${bet.awayGoals}` : '—'}
                </span>
                {points !== null && (
                  <span
                    className={`viewer-bet-points bet-points-${points}`}
                    data-testid={`viewer-points-${match.id}-${user.id}`}
                  >
                    +{points}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export function ViewerPage() {
  return (
    <div className="page" data-testid="viewer-page">
      <h1>Viewer</h1>
      <p className="page-intro">
        Everyone's predictions become visible at kickoff, next to the actual result and
        the points earned. The leaderboard totals points across all finished matches.
      </p>

      <h2>Leaderboard</h2>
      <Leaderboard />

      <h2>Matches</h2>
      {groups.map((group) => (
        <section
          key={group.id}
          className="viewer-group"
          data-testid={`viewer-group-${group.id}`}
        >
          <h3>Group {group.id}</h3>
          {getMatchesByGroup(group.id).map((m) => (
            <ViewerMatch key={m.id} match={m} />
          ))}
        </section>
      ))}
    </div>
  );
}
