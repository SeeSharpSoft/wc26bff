import { Leaderboard } from '../components/Leaderboard';

export function PointsPage() {
  return (
    <div className="page" data-testid="points-page">
      <h1>Points</h1>
      <p className="page-intro">
        The leaderboard totals every user's points across all finished matches — exact
        score = 3 points, correct goal difference = 2 points, correct tendency
        (win / draw / loss) = 1 point.
      </p>

      <Leaderboard />
    </div>
  );
}
