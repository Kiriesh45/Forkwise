import { scoreBand } from './scoring.js';
import type { CheckResult, RepoAnalysis } from './types.js';

/**
 * The sentence the panel leads with.
 *
 * A score answers "how much of the checklist passed", which is not the question
 * the reader arrived with. `headline` answers theirs — can I depend on this —
 * and `detail` adds the next most decisive finding, or nothing when the list
 * below says it better.
 */
export interface Verdict {
  headline: string;
  detail: string | null;
}

/** Certain, worded for the reader, and decisive enough to have capped the score. */
type Decisive = CheckResult & { consequence: string; ceiling: number };

export function verdictFor(analysis: RepoAnalysis): Verdict {
  const [worst, next] = analysis.checks.filter(isDecisive).sort(byHowMuchItDecides);

  if (worst === undefined) {
    return { headline: headlineForScore(analysis.score), detail: null };
  }

  return { headline: worst.consequence, detail: next?.consequence ?? null };
}

/**
 * Two conditions, and the second is what stops the panel contradicting itself.
 *
 * `fail` keeps guesses out of the headline: a heuristic is not allowed to
 * return it (docs/scoring.md), so filtering by status excludes every inferred
 * finding without a second list to keep in sync.
 *
 * A ceiling is what ties the headline to the number beside it. A failing check
 * without one leaves the weighted average untouched, so a well-run library
 * abandoned three years ago still scores 87 — and "No commits in 3 years" over
 * a green 87 reads as a broken tool. Demanding a ceiling means the score of any
 * repository we headline is at most that ceiling, which no ceiling in the
 * codebase puts in the good band.
 */
function isDecisive(check: CheckResult): check is Decisive {
  return check.status === 'fail' && check.ceiling !== undefined && check.consequence !== undefined;
}

/**
 * A lower ceiling is a stronger statement about how little else matters. Weight
 * only breaks ties between findings that cap the score at the same point.
 */
function byHowMuchItDecides(a: Decisive, b: Decisive): number {
  return a.ceiling === b.ceiling ? b.weight - a.weight : a.ceiling - b.ceiling;
}

/**
 * Nothing failed outright, so the headline falls back to the score. Vaguer on
 * purpose: a pile of warnings supports "usable, with gaps" and nothing sharper.
 */
function headlineForScore(score: number | null): string {
  switch (scoreBand(score)) {
    case 'good':
      return 'Looks safe to depend on';
    case 'fair':
      return 'Usable, with gaps';
    case 'poor':
      return 'Weak on several fronts';
    case 'unknown':
      return 'Not enough data to judge';
  }
}
