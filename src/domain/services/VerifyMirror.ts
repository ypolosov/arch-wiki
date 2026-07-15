import { findRepoPathLeaks } from './ConfluenceTree';

/**
 * Deterministic faithfulness gate for the Confluence mirror (FPF A.6.3.CSC — the
 * projection is a Controlled Semantic Coarsening; the git source-of-truth must not
 * survive it; E.17.EFP — an explanation view must be faithful). This ASSERTS the
 * two-tier acceptance that was previously prose in `publish.md`:
 *   tier i  — no repo-internal source path in the body OR the RU-mask restore values;
 *   tier ii — external/POC git URLs (bitbucket.org/…, git.shakuro.com) are kept (never flagged).
 * Pure; the CLI feeds it a saved render plan.
 */
export interface MirrorPageForVerify {
  source: string;
  body: string;
  restore?: ReadonlyArray<{ original?: string }>;
}

export interface MirrorViolation {
  page: string;
  where: 'body' | 'restore';
  leaks: string[];
}

export interface VerifyMirrorResult {
  ok: boolean;
  checked: number;
  violations: MirrorViolation[];
}

export function verifyMirror(pages: ReadonlyArray<MirrorPageForVerify>): VerifyMirrorResult {
  const violations: MirrorViolation[] = [];
  for (const p of pages) {
    const bodyLeaks = findRepoPathLeaks(p.body ?? '');
    if (bodyLeaks.length) violations.push({ page: p.source, where: 'body', leaks: bodyLeaks });
    const restoreText = (p.restore ?? []).map((r) => r.original ?? '').join('\n');
    const restoreLeaks = findRepoPathLeaks(restoreText);
    if (restoreLeaks.length) violations.push({ page: p.source, where: 'restore', leaks: restoreLeaks });
  }
  return {
    ok: violations.length === 0,
    checked: pages.length,
    violations: violations.sort((a, b) => a.page.localeCompare(b.page) || a.where.localeCompare(b.where)),
  };
}
