import type { RepoAnalysis } from '../../../core/types.js';
import type { Freshness, RateLimitStatus } from '../../../messaging.js';
import { describeFreshness, scoreBand } from '../format.js';

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

      <p className={`score band-${scoreBand(analysis.score)}`}>
        {/* A dash, not a zero: we could not measure it, which is not the same
            as measuring badly. */}
        <span className="value">{analysis.score ?? '—'}</span>
        <span className="out-of">/100</span>
      </p>

      <p className="meta">
        {describeFreshness(freshness)}
        {rateLimit !== undefined && ` · ${rateLimit.remaining}/${rateLimit.limit} requests left`}
      </p>
    </header>
  );
}
