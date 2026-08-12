import { describe, expect, it } from 'vitest';
import { hasTests } from '../../src/core/checks/has-tests.js';
import { makeInput } from '../helpers/check-input.js';

describe('hasTests', () => {
  it('recognises a suite in one root file', () => {
    // sindresorhus/slugify keeps its whole suite in test.js, which the first
    // version of the patterns missed.
    const result = hasTests(makeInput({ files: ['index.js', 'test.js'] }));

    expect(result.status).toBe('pass');
    expect(result.evidence[0]?.text).toContain('test.js');
  });

  it('recognises files named after the convention', () => {
    const result = hasTests(makeInput({ files: ['src/app.spec.ts', 'src/app.ts'] }));

    expect(result.status).toBe('pass');
  });

  it('recognises code inside a test directory', () => {
    const result = hasTests(makeInput({ files: ['tests/render.py', 'main.py'] }));

    expect(result.status).toBe('pass');
  });

  it('ignores tool configuration that merely lives under a "test" path', () => {
    // react/react: .claude/skills/test/SKILL.md was reported as proof of tests.
    const result = hasTests(makeInput({ files: ['.claude/skills/test/SKILL.md', 'index.js'] }));

    expect(result.status).toBe('warn');
  });

  it('ignores documentation inside a "specs" directory', () => {
    // torvalds/linux: Documentation/netlink/specs/index.rst survived the first
    // fix because it only excluded a list of documentation extensions.
    const result = hasTests(makeInput({ files: ['Documentation/netlink/specs/index.rst'] }));

    expect(result.status).toBe('warn');
  });

  it('prefers the strongest evidence it can find', () => {
    const result = hasTests(
      makeInput({ files: ['tests/helper.ts', 'src/parser.test.ts'] }),
    );

    expect(result.evidence[0]?.text).toContain('src/parser.test.ts');
  });

  it('reports unknown rather than absent when the tree was truncated', () => {
    const result = hasTests(makeInput({ files: ['index.js'], treeComplete: false }));

    expect(result.status).toBe('unknown');
  });
});
