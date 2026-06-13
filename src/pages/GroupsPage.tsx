import { groups, getMatchesByGroup } from '../data';
import { MatchCard } from '../components/MatchCard';
import { StandingsTable } from '../components/StandingsTable';

export function GroupsPage() {
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
