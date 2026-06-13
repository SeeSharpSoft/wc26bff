import { getMatchesByGroup, getTeam, flagUrl } from '../data';
import { computeGroupStandings } from '../domain/standings';
import { useResults } from '../context/ResultsContext';
import './StandingsTable.css';

export function StandingsTable({
  groupId,
  teamIds,
}: {
  groupId: string;
  teamIds: string[];
}) {
  const { results } = useResults();
  const rows = computeGroupStandings(teamIds, getMatchesByGroup(groupId), results);

  return (
    <table className="standings" data-testid={`standings-${groupId}`}>
      <thead>
        <tr>
          <th className="standings-team">Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GF</th>
          <th>GA</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const team = getTeam(row.teamId)!;
          return (
            <tr key={row.teamId} data-testid={`standings-${groupId}-${row.teamId}`}>
              <td className="standings-team">
                <img className="flag" src={flagUrl(team)} alt="" width={20} height={14} />
                {team.name}
              </td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td>{row.goalDiff}</td>
              <td className="standings-pts">{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
