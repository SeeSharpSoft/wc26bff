import { useMemo } from 'react';
import { getMatchesByStage } from '../data';
import type { Match } from '../types';
import { MatchCard } from '../components/MatchCard';
import { formatDate } from '../utils/time';

interface DayGroup {
  key: string;
  label: string;
  matches: Match[];
}

function groupByLocalDate(matches: Match[]): DayGroup[] {
  const byDay = new Map<string, Match[]>();
  for (const m of matches) {
    // Group by the local calendar date of kickoff (YYYY-MM-DD in local time).
    const d = new Date(m.kickoff);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const list = byDay.get(key) ?? [];
    list.push(m);
    byDay.set(key, list);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      label: formatDate(list[0].kickoff),
      matches: list.sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    }));
}

export function SchedulePage() {
  const days = useMemo(() => groupByLocalDate(getMatchesByStage('group')), []);

  return (
    <div className="page" data-testid="schedule-page">
      <h1>Schedule</h1>
      <p className="page-intro">
        All group-stage matches by day (your local time). Predict each scoreline before
        kickoff.
      </p>

      {days.map((day) => (
        <section key={day.key} className="day-section" data-testid={`day-${day.key}`}>
          <h2 className="day-heading">{day.label}</h2>
          <div className="match-grid">
            {day.matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
