/**
 * Scratch runner. `npm run play` — nothing here ships.
 */

import { GitHubClient } from './data/github/client.js';

const client = new GitHubClient();

const repo = await client.fetchRepo('facebook', 'react');
console.log('repo:', repo.owner.login, repo.name, repo.license?.spdx_id, repo.default_branch);

const tree = await client.fetchTree('facebook', 'react', repo.default_branch);
console.log('files in tree:', tree.tree.length, '| truncated:', tree.truncated);

console.log('rate limit:', client.rateLimit);
