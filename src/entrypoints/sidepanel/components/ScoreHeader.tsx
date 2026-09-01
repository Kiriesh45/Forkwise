import { scoreBand } from '../../../core/scoring.js';
import type { RepoAnalysis } from '../../../core/types.js';
import { verdictFor } from '../../../core/verdict.js';
import type { Freshness, RateLimitStatus } from '../../../messaging.js';
import { BAND_LABEL, describeBudget, describeFreshness } from '../format.js';

interface ScoreHeaderProps {
  analysis: RepoAnalysis;
  freshness: Freshness;
  rateLimit?: RateLimitStatus;
}

export function ScoreHeader({
  analysis,
  freshness,
  rateLimit,
}: ScoreHeaderProps): React.JSX.Element {
  const { owner, name } = analysis.repo;
  const verdict = verdictFor(analysis);
  const band = scoreBand(analysis.score);
  const budget = describeBudget(rateLimit);

  return (
    <header className="score-header">
      <a
        className="repo"
        href={`https://github.com/${owner}/${name}`}
        target="_blank"
        rel="noreferrer"
      >
        {owner}/{name}
      </a>

      {/* The verdict is the heading, not the number: the reader asked whether
          they can depend on this, and 30/100 only answers that once you have
          read docs/scoring.md. The score sits alongside as corroboration. */}
      <div className="judgement">
        <div className="verdict">
          <h1 className="headline">{verdict.headline}</h1>
          {verdict.detail !== null && <p className="detail">{verdict.detail}</p>}
        </div>

        <p className={`score band-${band}`}>
          {/* A dash, not a zero: we could not measure it, which is not the same
              as measuring badly. */}
          <span className="value">{analysis.score ?? '—'}</span>
          {analysis.score !== null && <span className="out-of">/100</span>}
          <span className="band-label">{BAND_LABEL[band]}</span>
        </p>
      </div>

      <p className="meta">
        {describeFreshness(freshness)}
        {budget !== null && ` · ${budget}`}
      </p>
    </header>
  );
}
