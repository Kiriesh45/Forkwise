/**
 * Renders the side panel to a static HTML file, so it can be looked at — and
 * screenshotted for the README and the store listings — without loading the
 * extension into a browser.
 *
 * It drives the real components with the real checks and the real scoring, and
 * that matters: an earlier version of this script wrote the check results by
 * hand, kept showing a stale score after the model changed, and quietly lied
 * about what the panel would do.
 *
 * Fixtures come from the test helper on purpose. It already describes the
 * repository shapes we care about, and a second copy would drift from it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createElement as h, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { allChecks } from '../src/core/checks/index.js';
import { scoreReport } from '../src/core/scoring.js';
import type { CheckInput } from '../src/core/types.js';
import { CheckList } from '../src/entrypoints/sidepanel/components/CheckList.js';
import { ScoreHeader } from '../src/entrypoints/sidepanel/components/ScoreHeader.js';
import type { Freshness, RateLimitStatus } from '../src/messaging.js';
import { daysAgo, makeInput, NOW } from '../tests/helpers/check-input.js';

const OUT = '.output/preview.html';

/** The width Chrome opens a side panel at, so the screenshots match reality. */
const PANEL_WIDTH = 360;

const WELL_RUN = [
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'package.json',
  '.github/workflows/ci.yml',
  'src/index.ts',
  'test/index.test.ts',
];

const TEAM = ['ana', 'bo', 'cy', 'ana', 'bo'].map((author) => ({
  author,
  committedAt: daysAgo(3),
}));

function panel(
  owner: string,
  name: string,
  input: CheckInput,
  freshness: Freshness,
  rateLimit?: RateLimitStatus,
) {
  const withName: CheckInput = { ...input, repo: { ...input.repo, owner, name } };
  const analysis = scoreReport({
    repo: withName.repo,
    checks: allChecks.map((check) => check(withName)),
    generatedAt: NOW.toISOString(),
  });

  return h(
    'div',
    { className: 'frame', key: `${owner}/${name}` },
    h(
      'main',
      { className: 'panel' },
      h(ScoreHeader, { analysis, freshness, ...(rateLimit === undefined ? {} : { rateLimit }) }),
      h(CheckList, { analysis }),
    ),
  );
}

const abandoned = makeInput({
  repo: { isArchived: true, license: { kind: 'none' }, pushedAt: daysAgo(1723) },
  files: ['README.md', 'src/index.js', 'test/index.test.js', '.github/workflows/ci.yml'],
  commits: [{ author: 'ana', committedAt: daysAgo(1723) }],
  // Spelled out rather than left to the helper's default, which reads "not
  // exercised by this test" — true in a test, nonsense in a screenshot. This
  // is the wording analyze-repo.ts produces for a repository with no manifest.
  vulnerabilities: {
    kind: 'not-checked',
    reason: 'No package.json, so there is nothing to look up',
  },
});

const vulnerable = makeInput({
  files: WELL_RUN,
  commits: TEAM,
  dependencies: {
    kind: 'resolved',
    dependencies: [{ name: 'minimist', version: '1.2.5' }],
    fromLockfile: true,
  },
  vulnerabilities: {
    kind: 'checked',
    packagesChecked: 28,
    packagesSkipped: 0,
    vulnerabilities: [
      {
        id: 'GHSA-xvch-5gv4-984h',
        packageName: 'minimist',
        severity: 'MODERATE',
        summary: 'Prototype Pollution in minimist',
        url: 'https://github.com/advisories/GHSA-xvch-5gv4-984h',
      },
    ],
  },
});

const healthy = makeInput({
  files: WELL_RUN,
  commits: TEAM,
  dependencies: { kind: 'resolved', dependencies: [], fromLockfile: true },
  vulnerabilities: {
    kind: 'checked',
    vulnerabilities: [],
    packagesChecked: 28,
    packagesSkipped: 0,
  },
});

const body = renderToStaticMarkup(
  h(
    Fragment,
    null,
    panel('facebookarchive', 'draft-js', abandoned, { kind: 'fresh' }),
    panel('acme', 'widget-parser', vulnerable, { kind: 'cached', ageMs: 3 * 3600_000 }),
    panel('acme', 'slugify', healthy, { kind: 'fresh' }),
  ),
);

const style = readFileSync('src/entrypoints/sidepanel/style.css', 'utf8');

mkdirSync('.output', { recursive: true });
writeFileSync(
  OUT,
  `<!doctype html>
<meta charset="utf-8" />
<title>Forkwise panel preview</title>
<style>
${style}
body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
}
.frame {
  width: ${String(PANEL_WIDTH)}px;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 8px;
}
</style>
${body}
`,
);

process.stdout.write(`Wrote ${OUT}. Open it in a browser to screenshot the panel.\n`);
