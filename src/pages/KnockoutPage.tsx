import { getMatchesByStage } from '../data';
import { KNOCKOUT_STAGES } from '../domain/stages';
import { MatchCard } from '../components/MatchCard';
import { ViewerMatch } from '../components/ViewerMatch';
import { useViewerMode } from '../context/ViewerModeContext';

export function KnockoutPage() {
  const { viewerMode } = useViewerMode();

  if (viewerMode) {
    return (
      <div className="page" data-testid="knockout-page">
        <h1>Viewer — Knockout stage</h1>
        <p className="page-intro">
          Everyone's knockout guesses, revealed at kickoff next to the actual result.
          Fixtures fill in as group standings settle and earlier rounds finish.
        </p>

        {KNOCKOUT_STAGES.map((stage) => {
          const stageMatches = getMatchesByStage(stage);
          if (stageMatches.length === 0) return null;
          return (
            <section
              key={stage}
              className="viewer-group"
              data-testid={`viewer-stage-${stage}`}
            >
              <h3>{stageMatches[0].roundLabel}</h3>
              {stageMatches.map((m) => (
                <ViewerMatch key={m.id} match={m} />
              ))}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="page" data-testid="knockout-page">
      <h1>Knockout stage</h1>
      <p className="page-intro">
        Predict every knockout scoreline — bets lock at kickoff. Fixtures fill in as group
        standings settle and earlier rounds finish; until then they show their placeholder
        (e.g. <code>1A</code>, <code>W74</code>). You can still bet on a scoreline before
        the teams are known.
      </p>

      {KNOCKOUT_STAGES.map((stage) => {
        const stageMatches = getMatchesByStage(stage);
        if (stageMatches.length === 0) return null;
        return (
          <section
            key={stage}
            className="group-section"
            data-testid={`knockout-stage-${stage}`}
          >
            <h2>{stageMatches[0].roundLabel}</h2>
            <div className="match-grid">
              {stageMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
