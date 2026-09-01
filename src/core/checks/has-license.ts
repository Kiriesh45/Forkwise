import type { Check } from '../types.js';

const id = 'has-license';
const title = 'License';
const weight = 5;

/**
 * Reads GitHub's own license detection rather than looking for a file: GitHub
 * runs licensee against the repository and reports what it recognised, which
 * is strictly more informative than a filename match.
 *
 * No license is worse than an unrecognised one. Without a license the default
 * is "all rights reserved" — the code is legally not reusable, however public
 * it looks.
 */
export const hasLicense: Check = ({ repo }) => {
  switch (repo.license.kind) {
    case 'spdx':
      return {
        id,
        title,
        weight,
        status: 'pass',
        evidence: [{ text: `Licensed under ${repo.license.id}` }],
      };

    case 'unidentified':
      return {
        id,
        title,
        weight,
        status: 'warn',
        evidence: [{ text: 'A license file exists, but GitHub could not identify it' }],
        fix: 'Use the unmodified text of a standard license so tools can recognise it.',
      };

    case 'none':
      return {
        id,
        title,
        weight,
        status: 'fail',
        evidence: [{ text: 'No license — the code is "all rights reserved" by default' }],
        fix: 'Add a LICENSE file. Without one, nobody may legally reuse this code.',
        consequence: 'No license, so you have no legal right to use it',
        // However good the code is, you may not legally use it.
        ceiling: 45,
      };
  }
};
