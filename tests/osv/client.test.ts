import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dependency } from '../../src/core/types.js';
import { OsvClient, OsvUnavailable } from '../../src/data/osv/client.js';

let requests: { url: string; body: unknown }[];
let batchResults: { vulns?: { id: string }[] }[];
let detailFor: (id: string) => unknown;

beforeEach(() => {
  requests = [];
  batchResults = [];
  detailFor = (id) => ({ id });

  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    requests.push({
      url: input,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });

    const id = input.slice(input.lastIndexOf('/') + 1);
    const body = input.endsWith('/v1/querybatch') ? { results: batchResults } : detailFor(id);

    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function dependencies(...pairs: [string, string | null][]): Dependency[] {
  return pairs.map(([name, version]) => ({ name, version }));
}

describe('OsvClient', () => {
  it('asks nothing when no version could be resolved', async () => {
    const found = await new OsvClient().findVulnerabilities(dependencies(['react', null]));

    expect(found).toEqual([]);
    expect(requests).toHaveLength(0);
  });

  it('queries every resolved package in a single request', async () => {
    batchResults = [{}, {}];

    await new OsvClient().findVulnerabilities(
      dependencies(['react', '18.3.1'], ['lodash', '4.17.20']),
    );

    expect(requests).toHaveLength(1);
    expect(requests[0]?.body).toEqual({
      queries: [
        { package: { name: 'react', ecosystem: 'npm' }, version: '18.3.1' },
        { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
      ],
    });
  });

  it('skips packages with no resolved version rather than querying them blind', async () => {
    batchResults = [{}];

    await new OsvClient().findVulnerabilities(dependencies(['react', null], ['lodash', '4.17.20']));

    expect(requests[0]?.body).toMatchObject({ queries: [{ package: { name: 'lodash' } }] });
  });

  it('treats an empty object as "no advisories", which is how OSV says it', async () => {
    batchResults = [{}];

    const found = await new OsvClient().findVulnerabilities(dependencies(['react', '18.3.1']));

    expect(found).toEqual([]);
  });

  it('attributes each advisory to the package at the same position', async () => {
    // The response carries no package names at all: position is the only link
    // between an advisory and what it belongs to.
    batchResults = [{}, { vulns: [{ id: 'GHSA-aaa' }] }];

    const found = await new OsvClient().findVulnerabilities(
      dependencies(['react', '18.3.1'], ['lodash', '4.17.20']),
    );

    expect(found).toHaveLength(1);
    expect(found[0]?.packageName).toBe('lodash');
    expect(found[0]?.url).toBe('https://osv.dev/vulnerability/GHSA-aaa');
  });

  it('fills in the severity a reader can understand', async () => {
    batchResults = [{ vulns: [{ id: 'GHSA-aaa' }] }];
    detailFor = (id) => ({
      id,
      summary: 'Command Injection in lodash',
      // The plain word only exists here; the `severity` field holds a CVSS
      // vector string that means nothing to a person.
      database_specific: { severity: 'HIGH' },
    });

    const [found] = await new OsvClient().findVulnerabilities(dependencies(['lodash', '4.17.20']));

    expect(found?.severity).toBe('HIGH');
    expect(found?.summary).toBe('Command Injection in lodash');
  });

  it('caps how many advisories it looks up in detail', async () => {
    batchResults = [{ vulns: Array.from({ length: 12 }, (_, index) => ({ id: `GHSA-${index}` })) }];

    const found = await new OsvClient().findVulnerabilities(dependencies(['lodash', '4.17.20']));

    // All twelve are reported; only the first few cost a round trip.
    expect(found).toHaveLength(12);
    expect(requests.filter((request) => request.url.includes('/v1/vulns/'))).toHaveLength(8);
    expect(found[11]?.severity).toBeNull();
  });

  it('reports the database being down as its own failure', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('nope', { status: 503 })));

    await expect(
      new OsvClient().findVulnerabilities(dependencies(['lodash', '4.17.20'])),
    ).rejects.toBeInstanceOf(OsvUnavailable);
  });

  it('reports a dead connection as its own failure', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network down')));

    await expect(
      new OsvClient().findVulnerabilities(dependencies(['lodash', '4.17.20'])),
    ).rejects.toBeInstanceOf(OsvUnavailable);
  });
});
