import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface PruneStoryDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
}

export interface PruneStoryOptions {
  /** When false (default) this is a PLAN: orphans are listed, nothing is deleted. */
  commit?: boolean;
}

export interface PruneStoryResult {
  /** false → `pruned` lists deletion CANDIDATES (plan); true → they were deleted. */
  committed: boolean;
  pruned: { pageId: string; relPath: string }[];
}

/**
 * CAP-1 orphan reconcile: given the page-ids still present upstream (live
 * descendants the orchestrator enumerated), find snapshot files + ledger rows for
 * any pulled story that has disappeared (PO restructured the log). **Plan by
 * default** — deletes only under `commit: true` (the command layer maps `--commit`,
 * and shows the plan to the human first). `pulled-sources.json` is the authority
 * (invariant 7); we only ever touch rows WE recorded.
 */
export async function pruneStorySnapshots(
  livePageIds: string[],
  deps: PruneStoryDeps,
  options: PruneStoryOptions = {},
): Promise<PruneStoryResult> {
  const commit = options.commit === true;
  const live = new Set(livePageIds);
  const rows = await deps.ledger.readPulled();
  const orphans = rows.filter((r) => !live.has(r.pageId));
  if (commit) {
    for (const o of orphans) {
      await deps.repo.deleteFile(o.relPath);
      await deps.ledger.removePulled(o.pageId);
    }
  }
  return {
    committed: commit,
    pruned: orphans
      .map((o) => ({ pageId: o.pageId, relPath: o.relPath }))
      .sort((a, b) => a.pageId.localeCompare(b.pageId)),
  };
}
