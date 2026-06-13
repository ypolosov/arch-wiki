import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface PruneStoryDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
}

export interface PruneStoryResult {
  pruned: { pageId: string; relPath: string }[];
}

/**
 * CAP-1 orphan reconcile: given the page-ids still present upstream (live
 * descendants the orchestrator enumerated), delete snapshot files + ledger rows
 * for any pulled story that has disappeared (PO restructured the log). Human-gated
 * at the command layer. `pulled-sources.json` is the authority (invariant 7); we
 * only ever touch rows WE recorded.
 */
export async function pruneStorySnapshots(
  livePageIds: string[],
  deps: PruneStoryDeps,
): Promise<PruneStoryResult> {
  const live = new Set(livePageIds);
  const rows = await deps.ledger.readPulled();
  const orphans = rows.filter((r) => !live.has(r.pageId));
  for (const o of orphans) {
    await deps.repo.deleteFile(o.relPath);
    await deps.ledger.removePulled(o.pageId);
  }
  return {
    pruned: orphans
      .map((o) => ({ pageId: o.pageId, relPath: o.relPath }))
      .sort((a, b) => a.pageId.localeCompare(b.pageId)),
  };
}
