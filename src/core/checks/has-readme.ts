import { fileCheck } from './file-check.js';

export const hasReadme = fileCheck({
  id: 'has-readme',
  title: 'README present',
  weight: 3,
  /** The spellings GitHub itself will render as the repository front page. */
  candidates: ['README.md', 'README', 'README.rst', 'README.txt', 'docs/README.md'],
  missingStatus: 'fail',
  missingText: 'No README found',
  advice: 'Expect to read the source to learn what this does and how to call it.',
});
