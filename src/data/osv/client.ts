import type { Dependency, Vulnerability } from '../../core/types.js';
import type { OsvBatchResponse, OsvVulnerability } from './api-types.js';

const API_ROOT = 'https://api.osv.dev';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Advisories we look up in full, to put a severity and a sentence in front of
 * the user. The rest are reported by identifier only: a repository with eighty
 * findings does not need eighty extra round trips to make its point.
 */
const MAX_DETAIL_LOOKUPS = 8;

export class OsvUnavailable extends Error {
  constructor(cause: unknown) {
    super('The OSV vulnerability database is unreachable', { cause });
    this.name = 'OsvUnavailable';
  }
}

/**
 * Queries osv.dev, the open vulnerability database that aggregates GitHub
 * advisories, CVEs and ecosystem-specific sources. No key, no account, and
 * one request covers every package at once.
 */
export class OsvClient {
  async findVulnerabilities(dependencies: Dependency[]): Promise<Vulnerability[]> {
    const queryable = dependencies.filter(
      (dependency): dependency is Dependency & { version: string } => dependency.version !== null,
    );
    if (queryable.length === 0) {
      return [];
    }

    const batch = await this.post<OsvBatchResponse>('/v1/querybatch', {
      queries: queryable.map((dependency) => ({
        package: { name: dependency.name, ecosystem: 'npm' },
        version: dependency.version,
      })),
    });

    // Results line up with the queries by position, which is the only link
    // between an advisory and the package it belongs to.
    const found = batch.results.flatMap((result, index) =>
      (result.vulns ?? []).map((vuln) => ({
        id: vuln.id,
        packageName: queryable[index]?.name ?? 'unknown',
        severity: null,
        summary: null,
        url: `https://osv.dev/vulnerability/${vuln.id}`,
      })),
    );

    return this.withDetails(found);
  }

  private async withDetails(vulnerabilities: Vulnerability[]): Promise<Vulnerability[]> {
    const details = await Promise.all(
      vulnerabilities
        .slice(0, MAX_DETAIL_LOOKUPS)
        .map((vulnerability) => this.get<OsvVulnerability>(`/v1/vulns/${vulnerability.id}`)),
    );

    return vulnerabilities.map((vulnerability, index) => {
      const detail = details[index];
      if (detail === undefined) {
        return vulnerability;
      }
      return {
        ...vulnerability,
        severity: detail.database_specific?.severity ?? null,
        summary: detail.summary ?? null,
      };
    });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.send<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  private async get<T>(path: string): Promise<T> {
    return this.send<T>(path, { method: 'GET' });
  }

  private async send<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_ROOT}${path}`, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (cause) {
      throw new OsvUnavailable(cause);
    }

    if (!response.ok) {
      throw new OsvUnavailable(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
