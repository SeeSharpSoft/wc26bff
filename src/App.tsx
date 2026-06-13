import { groups, matches, teams, getTeam, flagUrl } from './data';
import type { Match } from './types';
import { formatDateTime, localTimeZoneLabel } from './utils/time';
import { Header } from './components/Header';
import { useUser } from './context/UserContext';
import './App.css';

function ResultBadge({ match }: { match: Match }) {
  if (!match.officialResult) return <span className="badge badge-scheduled">scheduled</span>;
  const { homeGoals, awayGoals } = match.officialResult;
  return (
    <span className="badge badge-final">
      {homeGoals}&ndash;{awayGoals}
    </span>
  );
}

function GroupCard({ groupId, teamIds }: { groupId: string; teamIds: string[] }) {
  return (
    <div className="group-card" data-testid={`group-${groupId}`}>
      <h3>Group {groupId}</h3>
      <ul>
        {teamIds.map((id) => {
          const team = getTeam(id)!;
          return (
            <li key={id}>
              <img className="flag" src={flagUrl(team)} alt="" width={20} height={14} />
              <span>{team.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function App() {
  const finishedCount = matches.filter((m) => m.officialResult).length;
  const upcoming = matches.filter((m) => !m.officialResult).slice(0, 6);
  const { activeUser } = useUser();

  return (
    <>
      <Header />
      <main className="app">
      <header className="app-header">
        <h1>World Cup 2026 — Friends Betting</h1>
        <p className="tagline">Predict every match. Compete with your friends.</p>
        <p className="active-user-banner" data-testid="active-user-banner">
          {activeUser
            ? `Betting as ${activeUser.name}`
            : 'No active user — add one in the header to start betting.'}
        </p>
        <p className="stats" data-testid="stats">
          <strong>{teams.length}</strong> teams ·{' '}
          <strong>{groups.length}</strong> groups ·{' '}
          <strong>{matches.length}</strong> matches ·{' '}
          <strong>{finishedCount}</strong> played
        </p>
      </header>

      <section aria-labelledby="groups-heading">
        <h2 id="groups-heading">Groups</h2>
        <div className="groups-grid" data-testid="groups-grid">
          {groups.map((g) => (
            <GroupCard key={g.id} groupId={g.id} teamIds={g.teamIds} />
          ))}
        </div>
      </section>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Next matches</h2>
        <ul className="match-list" data-testid="upcoming-list">
          {upcoming.map((m) => (
            <li key={m.id} className="match-row">
              <span className="match-round">{m.roundLabel}</span>
              <span className="match-teams">
                {m.home.kind === 'team' ? getTeam(m.home.teamId)!.name : m.home.label}
                {' v '}
                {m.away.kind === 'team' ? getTeam(m.away.teamId)!.name : m.away.label}
              </span>
              <span className="match-time">
                {formatDateTime(m.kickoff)} {localTimeZoneLabel(m.kickoff)}
              </span>
              <ResultBadge match={m} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="app-footer">
        Phase 2 — multi-user storage. Betting features coming next.
      </footer>
      </main>
    </>
  );
}

export default App;
