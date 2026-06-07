export interface IssueLedgerRow {
  /** External issue key, e.g. `GRM-431`. */
  key: string;
  /** Source artifact id this issue realizes, e.g. `QA-007`. */
  sourceId: string;
  kind: 'arch' | 'techdesign';
  /** Role for techdesign issues (be|fe|do), else null. */
  role: string | null;
  /** Content hash of the canonical payload when the issue was created. */
  contentHash: string;
  /** ISO timestamp. */
  createdAt: string;
  /** External system, e.g. `jira` / `gitlab`. */
  system: string;
}

export interface PageLedgerRow {
  /** Source artifact relpath/id projected to a showcase page. */
  source: string;
  /** External page identifier (e.g. Confluence page id/title). */
  page: string;
  contentHash: string;
  publishedAt: string;
  system: string;
}

/**
 * Driven port for the git-stored idempotency ledgers under `.arch-wiki/`. The
 * ledger is the authority: external systems reconcile FROM it (invariant 7).
 */
export interface LedgerStorePort {
  /** Issue ledger rows (`[]` if absent). */
  readIssues(): Promise<IssueLedgerRow[]>;
  /** Append a row idempotently (no-op if an identical key/source/kind/role exists). */
  appendIssue(row: IssueLedgerRow): Promise<boolean>;
  /** Showcase page ledger rows (`[]` if absent) — v0.5. */
  readPages(): Promise<PageLedgerRow[]>;
  appendPage(row: PageLedgerRow): Promise<boolean>;
}
