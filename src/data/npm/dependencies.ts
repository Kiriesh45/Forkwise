import type { Dependency, DependencyInfo } from '../../core/types.js';

/**
 * Reads npm manifests. Unlike the GitHub API these files are written by hand
 * and can be anything: truncated, commented, or not JSON at all. Defensive
 * parsing is warranted here in a way it is not at the API boundary — see
 * docs/decisions/0001-no-runtime-validation.md for the contrast.
 */

/** A range that names exactly one version, e.g. "18.2.0" but not "^18.2.0". */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?$/i;

export function parseDependencies(packageJson: string, lockfile: string | null): DependencyInfo {
  const manifest = parseJsonObject(packageJson);
  if (manifest === null) {
    return { kind: 'unavailable', reason: 'package.json is not valid JSON' };
  }

  // Direct dependencies only. Transitive ones live in the lock file and number
  // in the thousands; reporting them is a v0.2 problem.
  const declared = asRecord(manifest.dependencies);
  if (declared === null) {
    return { kind: 'resolved', dependencies: [], fromLockfile: false };
  }

  const resolved = lockfile === null ? null : parseLockfile(lockfile);

  const dependencies: Dependency[] = Object.entries(declared).map(([name, range]) => ({
    name,
    version: resolved?.get(name) ?? exactPin(range),
  }));

  return { kind: 'resolved', dependencies, fromLockfile: resolved !== null };
}

function exactPin(range: unknown): string | null {
  return typeof range === 'string' && EXACT_VERSION.test(range) ? range : null;
}

/**
 * Handles both lock file layouts. Version 1 keyed packages by name; versions 2
 * and 3 key them by install path, which is what makes duplicated transitive
 * versions expressible.
 */
function parseLockfile(lockfile: string): Map<string, string> | null {
  const parsed = parseJsonObject(lockfile);
  if (parsed === null) {
    return null;
  }

  const versions = new Map<string, string>();

  const byPath = asRecord(parsed.packages);
  if (byPath !== null) {
    for (const [path, entry] of Object.entries(byPath)) {
      // Only top-level installs: "node_modules/react" but not
      // "node_modules/a/node_modules/react", which is a's copy, not ours.
      if (!path.startsWith('node_modules/') || path.indexOf('node_modules/', 1) !== -1) {
        continue;
      }
      const version = asRecord(entry)?.version;
      if (typeof version === 'string') {
        versions.set(path.slice('node_modules/'.length), version);
      }
    }
  }

  const byName = asRecord(parsed.dependencies);
  if (byName !== null) {
    for (const [name, entry] of Object.entries(byName)) {
      const version = asRecord(entry)?.version;
      if (typeof version === 'string' && !versions.has(name)) {
        versions.set(name, version);
      }
    }
  }

  return versions.size === 0 ? null : versions;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
