import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import type { RepoLocation } from '../../core/repo-url.js';
import type { RepoAnalysis } from '../../core/types.js';
import type {
  AnalysisError,
  AnalysisResponse,
  ForkwiseMessage,
  Freshness,
  RateLimitStatus,
} from '../../messaging.js';
import { CheckList } from './components/CheckList.js';
import { Notice } from './components/Notice.js';
import { ScoreHeader } from './components/ScoreHeader.js';
import { describeError } from './format.js';
import { useCurrentRepo } from './use-current-repo.js';

/**
 * How an analysis ended. Written as a union so that adding an outcome forces
 * every branch below to be revisited — the alternative, a pile of `isLoading`
 * and `error` flags, allows states that mean nothing ("loading and failed at
 * once") and quietly forgets the ones that matter.
 */
type Outcome =
  | {
      kind: 'ready';
      analysis: RepoAnalysis;
      freshness: Freshness;
      rateLimit?: RateLimitStatus;
    }
  | { kind: 'failed'; error: AnalysisError };

/** Tagged with the repository it belongs to, so it can never be shown under another. */
interface Result {
  key: string;
  outcome: Outcome;
}

export function App(): React.JSX.Element {
  const repo = useCurrentRepo();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (repo === null) {
      return;
    }

    let abandoned = false;

    void (async () => {
      const request: ForkwiseMessage = { type: 'analyze', repo };
      const response = await browser.runtime.sendMessage<ForkwiseMessage, AnalysisResponse>(
        request,
      );

      // The user has moved on. Rendering this would show one repository's
      // findings under another one's name.
      if (abandoned) {
        return;
      }

      setResult({
        key: keyOf(repo),
        outcome: response.ok
          ? {
              kind: 'ready',
              analysis: response.analysis,
              freshness: response.freshness,
              ...(response.rateLimit === undefined ? {} : { rateLimit: response.rateLimit }),
            }
          : { kind: 'failed', error: response.error },
      });
    })();

    return () => {
      abandoned = true;
    };
  }, [repo]);

  if (repo === null) {
    return (
      <Notice
        title="No repository open"
        detail="Open any repository on github.com and Forkwise will grade it."
      />
    );
  }

  // Loading is derived, not stored: "we have no result for this repository
  // yet" is the same fact as "we are loading", and keeping both in sync by
  // hand is how a panel ends up spinning forever over data it already has.
  if (result === null || result.key !== keyOf(repo)) {
    return (
      <main className="panel">
        <p className="loading">Checking {keyOf(repo)}…</p>
      </main>
    );
  }

  if (result.outcome.kind === 'failed') {
    const notice = describeError(result.outcome.error, new Date());
    return <Notice title={notice.title} detail={notice.detail} />;
  }

  return (
    <main className="panel">
      <ScoreHeader
        analysis={result.outcome.analysis}
        freshness={result.outcome.freshness}
        rateLimit={result.outcome.rateLimit}
      />
      <CheckList analysis={result.outcome.analysis} />
    </main>
  );
}

function keyOf(repo: RepoLocation): string {
  return `${repo.owner}/${repo.repo}`;
}
