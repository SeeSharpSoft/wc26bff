import { groups, getMatchesByGroup } from '../data';
import { MatchCard } from '../components/MatchCard';
import { StandingsTable } from '../components/StandingsTable';
import { ViewerMatch } from '../components/ViewerMatch';
import { Leaderboard } from '../components/Leaderboard';
import { useViewerMode } from '../context/ViewerModeContext';

function GroupsViewer() {
  return (
    <div className="page" data-testid="groups-page">
      <h1>Viewer — Groups</h1>
      <p className="page-intro">
        Everyone's group-stage guesses, revealed at kickoff next to the actual result and
        the points earned. The leaderboard totals points across all finished matches.
      </p>

      <h2>Leaderboard</h2>
      <Leaderboard />

      <h2>Group matches</h2>
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

export function GroupsPage() {
  const { viewerMode } = useViewerMode();
  if (viewerMode) return <GroupsViewer />;

  return (
    <div className="page" data-testid="groups-page">
      <h1>Groups</h1>
      <p className="page-intro">
        Place a scoreline prediction for every group-stage match. Bets lock at kickoff.
        Standings update from synced results.
      </p>

      <div className="group-sections">
        {groups.map((group) => {
          const matches = getMatchesByGroup(group.id);
          return (
            <section
              key={group.id}
              className="group-section"
              data-testid={`group-section-${group.id}`}
            >
              <h2>Group {group.id}</h2>
              <StandingsTable groupId={group.id} teamIds={group.teamIds} />
              <div className="match-grid">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
