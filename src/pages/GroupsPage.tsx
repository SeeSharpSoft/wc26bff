import { groups, getMatchesByGroup } from '../data';
import { MatchCard } from '../components/MatchCard';
import { StandingsTable } from '../components/StandingsTable';
import { ViewerMatch } from '../components/ViewerMatch';
import { useViewerMode } from '../context/ViewerModeContext';

export function GroupsPage() {
  const { viewerMode } = useViewerMode();

  return (
    <div className="page" data-testid="groups-page">
      <h1>{viewerMode ? 'Viewer — Groups' : 'Groups'}</h1>
      <p className="page-intro">
        {viewerMode
          ? "Everyone's group-stage guesses, revealed at kickoff next to the actual result. Standings update from synced results."
          : 'Place a scoreline prediction for every group-stage match. Bets lock at kickoff. Standings update from synced results.'}
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
              {viewerMode ? (
                <div className="viewer-group">
                  {matches.map((m) => (
                    <ViewerMatch key={m.id} match={m} />
                  ))}
                </div>
              ) : (
                <div className="match-grid">
                  {matches.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
