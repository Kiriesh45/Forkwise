import { fileUrl } from '../github-links.js';
import type { Check, CheckStatus } from '../types.js';

export interface FileCheckSpec {
  id: string;
  title: string;
  weight: number;
  /** Tried in order; the first hit wins. Matching ignores case. */
  candidates: string[];
  /** What absence means here. A missing license is not a missing changelog. */
  missingStatus: Extract<CheckStatus, 'warn' | 'fail'>;
  missingText: string;
  /** Absent when the finding gives a consumer nothing to act on. */
  advice?: string;
}

/**
 * Builds the "does one of these files exist?" check, which is the same three
 * branches every time: found, tree truncated so we cannot tell, absent.
 *
 * Extracted only after the third copy appeared. Checks that read repository
 * metadata or match on shape stay hand-written — squeezing them into this
 * shape would cost more than the duplication it saves.
 */
export function fileCheck(spec: FileCheckSpec): Check {
  const { id, title, weight } = spec;

  return ({ repo, files }) => {
    const path = files.find(...spec.candidates);

    if (path !== null) {
      return {
        id,
        title,
        weight,
        status: 'pass',
        evidence: [{ text: `Found ${path}`, url: fileUrl(repo, path) }],
      };
    }

    if (!files.isComplete) {
      return {
        id,
        title,
        weight,
        status: 'unknown',
        evidence: [{ text: 'GitHub truncated the file tree, so absence cannot be proven' }],
      };
    }

    return {
      id,
      title,
      weight,
      status: spec.missingStatus,
      evidence: [{ text: spec.missingText }],
      ...(spec.advice === undefined ? {} : { advice: spec.advice }),
    };
  };
}
