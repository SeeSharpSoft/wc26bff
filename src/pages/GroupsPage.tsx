import { groups, getMatchesByGroup, getTeam, flagUrl } from '../data';
import { MatchCard } from '../components/MatchCard';

export function GroupsPage() {
  return (
    <div className="page" data-testid="groups-page">
      <h1>Groups</h1>
      <p className="page-intro">
        Place a scoreline prediction for every group-stage match. Bets lock at kickoff.
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
              <ul className="group-teams">
                {group.teamIds.map((id) => {
                  const team = getTeam(id)!;
                  return (
                    <li key={id}>
                      <img
                        className="flag"
                        src={flagUrl(team)}
                        alt=""
                        width={22}
                        height={15}
                      />
                      {team.name}
                    </li>
                  );
                })}
              </ul>
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
