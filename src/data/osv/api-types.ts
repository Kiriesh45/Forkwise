/**
 * Raw shapes from api.osv.dev, covering only what Forkwise reads.
 */

/** POST /v1/querybatch — results are positional, matching the query order. */
export interface OsvBatchResponse {
  /** A package with no advisories comes back as `{}`, not as an empty list. */
  results: { vulns?: { id: string }[] }[];
}

/** GET /v1/vulns/{id} */
export interface OsvVulnerability {
  id: string;
  summary?: string;
  /**
   * The machine-readable `severity` field holds a CVSS vector string, which is
   * useless to a reader. The plain word ("HIGH", "MODERATE") only exists here,
   * and only for advisories that came from GitHub.
   */
  database_specific?: { severity?: string };
}
