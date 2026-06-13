import { ProjectConfig } from '../../domain/services/ProjectConfig';
import { LedgerStorePort, PulledSourceRow } from '../ports/LedgerStorePort';

export interface StoryPullPlan {
  cloudId: string;
  rootPageId: string;
  childTitlePrefix: string;
  /** What has already been pulled (for changed-only skipping + orphan reconcile). */
  alreadyPulled: PulledSourceRow[];
}

export interface RenderStoryPullPlanDeps {
  config: ProjectConfig;
  ledger: LedgerStorePort;
}

/**
 * CAP-1, step 1 (render): emit the deterministic plan for the orchestrator to
 * drive the Confluence MCP enumeration. Core does NOT touch Confluence — it only
 * reads config (`userStoryLog()`, throws exit 2 if absent) and the pulled ledger
 * (egress/ingress invariant 6: render → MCP perform → ledger).
 */
export async function renderStoryPullPlan(deps: RenderStoryPullPlanDeps): Promise<StoryPullPlan> {
  const u = deps.config.userStoryLog();
  return {
    cloudId: u.cloudId,
    rootPageId: u.pageId,
    childTitlePrefix: u.childTitlePrefix ?? 'Story:',
    alreadyPulled: await deps.ledger.readPulled(),
  };
}
