import { fileUrl } from '../github-links.js';
import type { Check } from '../types.js';

const id = 'has-ci';
const title = 'Continuous integration';
const weight = 3;

const WORKFLOWS_DIRECTORY = '.github/workflows';

/** Config files of the providers still in wide use outside GitHub Actions. */
const OTHER_CI_FILES = [
  '.gitlab-ci.yml',
  '.circleci/config.yml',
  '.travis.yml',
  'azure-pipelines.yml',
  'Jenkinsfile',
  '.drone.yml',
];

export const hasCi: Check = ({ repo, files }) => {
  if (files.hasUnder(WORKFLOWS_DIRECTORY)) {
    return {
      id,
      title,
      weight,
      status: 'pass',
      evidence: [{ text: 'GitHub Actions workflows configured' }],
    };
  }

  const otherConfig = files.find(...OTHER_CI_FILES);
  if (otherConfig !== null) {
    return {
      id,
      title,
      weight,
      status: 'pass',
      evidence: [{ text: `CI configured via ${otherConfig}`, url: fileUrl(repo, otherConfig) }],
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
    evidence: [{ text: 'No CI configuration found' }],
    advice:
      'Any tests here run only when someone remembers to, so check a release yourself before upgrading to it.',
  };
};
