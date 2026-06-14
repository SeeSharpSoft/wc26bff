import { useUser } from '../context/UserContext';
import { useBets } from '../context/BetsContext';
import { useResults } from '../context/ResultsContext';
import { computeLeaderboard } from '../domain/leaderboard';
import './Leaderboard.css';

export function Leaderboard() {
  const { users } = useUser();
  const { allBets } = useBets();
  const { results } = useResults();
  const rows = computeLeaderboard(users, allBets, results);

  if (users.length === 0) {
    return (
      <p className="leaderboard-empty" data-testid="leaderboard-empty">
        Add users to see the leaderboard.
      </p>
    );
  }

  return (
    <table className="leaderboard" data-testid="leaderboard">
      <thead>
        <tr>
          <th className="lb-rank">#</th>
          <th className="lb-name">User</th>
          <th>Played</th>
          <th>Exact</th>
          <th>Tendency</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.userId} data-testid={`leaderboard-row-${row.userId}`}>
            <td className="lb-rank">{i + 1}</td>
            <td className="lb-name">{row.name}</td>
            <td>{row.played}</td>
            <td>{row.exact}</td>
            <td>{row.tendency}</td>
            <td className="lb-points" data-testid={`leaderboard-points-${row.userId}`}>
              {row.points}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
