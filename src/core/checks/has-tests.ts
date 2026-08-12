import { fileUrl } from '../github-links.js';
import type { Check } from '../types.js';

const id = 'has-tests';
const title = 'Automated tests';
const weight = 4;

const TEST_DIRECTORIES = ['test', 'tests', 'spec', 'specs', '__tests__', 'e2e'];

/** Naming conventions across the ecosystems we are likely to meet. */
const TEST_FILE_PATTERNS = [
  /\.(test|spec)\.[a-z]+$/, // foo.test.ts, foo.spec.js
  /^test_[^/]+\.py$/, //       test_foo.py
  /_test\.(go|py|rb)$/, //     foo_test.go
  /test\.java$/, //            FooTest.java
];

/**
 * Extensions that can hold executable test code. An allow-list, not a list of
 * things to exclude: the first attempt excluded documentation extensions and
 * still matched `Documentation/netlink/specs/index.rst`. Anything unlisted is
 * treated as "not a test", which is the safe direction for a heuristic.
 */
const CODE_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'scala',
  'c', 'cc', 'cpp', 'h', 'hpp', 'cs', 'php', 'sh',
];

function fileNameOf(path: string): string {
  return path.toLowerCase().split('/').at(-1) ?? '';
}

/** A filename that names itself a test. The strongest signal we have. */
function isTestFileName(path: string): boolean {
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(fileNameOf(path)));
}

/**
 * A code file inside a test directory. Weaker, and easy to fool: `test` shows
 * up in tool configuration paths such as `.claude/skills/test/`, which is why
 * dot-directories and documentation files are excluded.
 */
function isInTestDirectory(path: string): boolean {
  const segments = path.toLowerCase().split('/');
  const directories = segments.slice(0, -1);

  if (directories.some((segment) => segment.startsWith('.'))) {
    return false;
  }
  if (!directories.some((segment) => TEST_DIRECTORIES.includes(segment))) {
    return false;
  }

  const extension = fileNameOf(path).split('.').at(-1) ?? '';
  return CODE_EXTENSIONS.includes(extension);
}

/**
 * A heuristic, so it never reports `fail`: tests can live in a sibling
 * repository, or follow a convention this list has never heard of. Hard
 * verdicts are for facts; guesses get a warning.
 */
export const hasTests: Check = ({ repo, files }) => {
  // Strong signal first: the evidence we show should be the most convincing
  // file we found, not merely the first one that matched anything.
  const path = files.findMatching(isTestFileName) ?? files.findMatching(isInTestDirectory);

  if (path !== null) {
    return {
      id,
      title,
      weight,
      status: 'pass',
      evidence: [{ text: `Test files present, e.g. ${path}`, url: fileUrl(repo, path) }],
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
    status: 'warn',
    evidence: [{ text: 'No files matching common test naming conventions' }],
    fix: 'Add automated tests. Without them, nothing stops a release from breaking dependents.',
  };
};
