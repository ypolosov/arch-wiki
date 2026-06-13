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

/** Ingress ledger for read-only snapshots pulled from an upstream source (CAP-1). */
export interface PulledSourceRow {
  /** Upstream page id (idempotency key). */
  pageId: string;
  /** Wiki-relative path of the written snapshot (under raw/_synced/). */
  relPath: string;
  title: string;
  /** Upstream page version, for changed-only detection. */
  version: number;
  /** Hash of the normalized snapshot body — drift signal on re-pull. */
  contentHash: string;
  pulledAt: string;
  source: string;
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
  /** Published-page ledger rows (`[]` if absent) — CAP-2 mirror. */
  readPages(): Promise<PageLedgerRow[]>;
  /** Upsert by `(page, source)`: false if identical, else (re)writes the hash (drift). */
  appendPage(row: PageLedgerRow): Promise<boolean>;
  /** Remove every row for a source relPath; true if any removed (orphan delete). */
  removePage(source: string): Promise<boolean>;
  /** Pulled-source rows (`[]` if absent) — CAP-1. */
  readPulled(): Promise<PulledSourceRow[]>;
  /** Upsert by `pageId`: false if an identical row exists, else (re)writes it. */
  appendPulled(row: PulledSourceRow): Promise<boolean>;
  /** Remove the row for `pageId`; true if one was removed (orphan reconcile). */
  removePulled(pageId: string): Promise<boolean>;
}
