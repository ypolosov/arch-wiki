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
  /**
   * The Confluence page version recorded at publish (CAP-2 destination-drift guard, v0.8).
   * Optional + read tolerantly (pre-0.8 ledgers omit it) — NO ledger migration. The
   * orchestrator compares the LIVE page version against this before update; a higher live
   * version means a hand-edit it must not clobber without --force. NOT an idempotency key
   * (the English contentHash stays the sole key, invariant #7) — a destination cross-check only.
   */
  pageVersion?: number;
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

/** A human-gated waiver suppressing an artifact's epistemic debt (FPF B.3.4 CC-ED.5). */
export interface DebtWaiverRow {
  /** Artifact basename whose debt is waived. */
  subject: string;
  reason: string;
  /** ISO date the waiver expires (`null` = indefinite). */
  until: string | null;
  /** Who authorized the waiver (audit). */
  by: string;
  waivedAt: string;
}

/**
 * Driven port for the git-stored idempotency ledgers under `.arch-wiki/`. The
 * ledger is the authority: external systems reconcile FROM it (invariant 7).
 */
export interface LedgerStorePort {
  /** Issue ledger rows (`[]` if absent). */
  readIssues(): Promise<IssueLedgerRow[]>;
  /** Upsert by `(key, sourceId, kind, role)`: false if identical, else (re)writes the hash (drift). */
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
  /** Epistemic-debt waiver rows (`[]` if absent) — FPF B.3.4 CC-ED.5. */
  readWaivers(): Promise<DebtWaiverRow[]>;
  /** Upsert by `subject`: false if an identical row exists, else (re)writes it. */
  appendWaiver(row: DebtWaiverRow): Promise<boolean>;
}
