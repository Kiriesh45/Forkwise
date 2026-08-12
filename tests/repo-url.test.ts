import { describe, expect, it } from 'vitest';
import { parseRepoUrl } from '../src/core/repo-url.js';

describe('parseRepoUrl', () => {
  it('reads a repository landing page', () => {
    expect(parseRepoUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('reads a page deep inside a repository', () => {
    expect(parseRepoUrl('https://github.com/facebook/react/blob/main/README.md')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('ignores a user profile, which has no repository', () => {
    expect(parseRepoUrl('https://github.com/facebook')).toBeNull();
  });

  it("ignores GitHub's own pages", () => {
    expect(parseRepoUrl('https://github.com/settings/profile')).toBeNull();
    expect(parseRepoUrl('https://github.com/orgs/facebook/repositories')).toBeNull();
    expect(parseRepoUrl('https://github.com/notifications')).toBeNull();
  });

  it('ignores other github hosts', () => {
    expect(parseRepoUrl('https://gist.github.com/someone/abc123')).toBeNull();
    expect(parseRepoUrl('https://docs.github.com/en/rest')).toBeNull();
  });

  it('strips the .git suffix from a clone url', () => {
    expect(parseRepoUrl('https://github.com/facebook/react.git')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('survives something that is not a url at all', () => {
    expect(parseRepoUrl('about:blank')).toBeNull();
    expect(parseRepoUrl('')).toBeNull();
  });
});
