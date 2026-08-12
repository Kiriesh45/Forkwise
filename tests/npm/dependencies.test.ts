import { describe, expect, it } from 'vitest';
import { parseDependencies } from '../../src/data/npm/dependencies.js';

const PACKAGE_JSON = JSON.stringify({
  name: 'widget',
  dependencies: { react: '^18.2.0', lodash: '4.17.21' },
  devDependencies: { vitest: '^1.0.0' },
});

describe('parseDependencies', () => {
  it('refuses to guess a version from a range', () => {
    const info = parseDependencies(PACKAGE_JSON, null);

    expect(info).toMatchObject({ kind: 'resolved', fromLockfile: false });
    if (info.kind !== 'resolved') return;
    expect(info.dependencies).toContainEqual({ name: 'react', version: null });
  });

  it('accepts a range that names exactly one version', () => {
    const info = parseDependencies(PACKAGE_JSON, null);

    if (info.kind !== 'resolved') throw new Error('expected resolved');
    expect(info.dependencies).toContainEqual({ name: 'lodash', version: '4.17.21' });
  });

  it('ignores devDependencies', () => {
    const info = parseDependencies(PACKAGE_JSON, null);

    if (info.kind !== 'resolved') throw new Error('expected resolved');
    expect(info.dependencies.map((dependency) => dependency.name)).toEqual(['react', 'lodash']);
  });

  it('resolves versions from a lockfileVersion 3 file', () => {
    const lock = JSON.stringify({
      lockfileVersion: 3,
      packages: {
        '': { name: 'widget' },
        'node_modules/react': { version: '18.3.1' },
      },
    });

    const info = parseDependencies(PACKAGE_JSON, lock);

    expect(info).toMatchObject({ kind: 'resolved', fromLockfile: true });
    if (info.kind !== 'resolved') return;
    expect(info.dependencies).toContainEqual({ name: 'react', version: '18.3.1' });
  });

  it('resolves versions from the legacy lockfileVersion 1 layout', () => {
    const lock = JSON.stringify({
      lockfileVersion: 1,
      dependencies: { react: { version: '18.0.0' } },
    });

    const info = parseDependencies(PACKAGE_JSON, lock);

    if (info.kind !== 'resolved') throw new Error('expected resolved');
    expect(info.dependencies).toContainEqual({ name: 'react', version: '18.0.0' });
  });

  it('ignores a nested copy belonging to another package', () => {
    // node_modules/eslint/node_modules/react is eslint's private copy, not the
    // version this repository installs.
    const lock = JSON.stringify({
      lockfileVersion: 3,
      packages: {
        'node_modules/eslint/node_modules/react': { version: '16.0.0' },
      },
    });

    const info = parseDependencies(PACKAGE_JSON, lock);

    if (info.kind !== 'resolved') throw new Error('expected resolved');
    expect(info.dependencies).toContainEqual({ name: 'react', version: null });
  });

  it('reports unavailable rather than crashing on a broken manifest', () => {
    expect(parseDependencies('{ not json', null)).toMatchObject({ kind: 'unavailable' });
  });

  it('survives a broken lock file by falling back to the manifest', () => {
    const info = parseDependencies(PACKAGE_JSON, 'truncated…');

    expect(info).toMatchObject({ kind: 'resolved', fromLockfile: false });
  });
});
