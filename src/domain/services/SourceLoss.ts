/**
 * Typed vocabulary of Confluence-mirror **source-loss modes** (FPF A.6.3.CSC — the mirror is a
 * *Controlled Semantic Coarsening* of the git canon). The mirror is a curated PROJECTION, not a
 * byte copy: it deliberately drops or renames repo-internal source-of-truth references so the git
 * layout never surfaces in Confluence. Each such curation is a *typed loss* (this closed vocabulary)
 * rather than a free-text note — so a downstream reader (the `publish` orchestrator, a faithfulness
 * report) can reason over WHAT was coarsened by kind, not merely echo a string.
 *
 * The human-readable `message` is kept byte-identical to the pre-typing free-text warning, so the
 * legacy `warnings[]` display surface is unchanged (additive, non-destructive). Pure; no I/O.
 */
export type SourceLossMode =
  /** A repo-relative link (`../iterations/`, `CLAUDE.md`, `c4/…`) flattened to plain text. */
  | 'repo-relative-link-neutralized'
  /** A local image embed (`![](../c4/x.png)`) replaced by a deterministic C4 diagram placeholder. */
  | 'local-image-stubbed'
  /** The `## Sources` provenance section removed (git source-of-truth is not mirrored). */
  | 'provenance-section-stripped'
  /** A `**Source:**` field citing the git source-of-truth removed (non-git remainder kept). */
  | 'provenance-field-stripped'
  /** An inline repo-internal path renamed in place to a human phrase (`humanizeRepoRef`). */
  | 'repo-path-renamed';

export interface SourceLoss {
  mode: SourceLossMode;
  /** Human-readable detail — byte-identical to the legacy free-text warning for this curation. */
  message: string;
  /** The affected repo references, when the mode enumerates them; empty otherwise. */
  subjects: string[];
}

/** The canonical human message for a source-loss mode (matches the historical `warnings[]` text). */
export function sourceLossMessage(mode: SourceLossMode, subjects: readonly string[] = []): string {
  switch (mode) {
    case 'repo-relative-link-neutralized':
      return `neutralized ${subjects.length} repo-relative link(s) to plain text: ${subjects.join(', ')}`;
    case 'local-image-stubbed':
      return `stubbed ${subjects.length} local image(s) as C4 diagram placeholder(s): ${subjects.join(', ')}`;
    case 'provenance-section-stripped':
      return 'stripped the `## Sources` provenance section (git source-of-truth is not mirrored)';
    case 'provenance-field-stripped':
      return 'stripped a `**Source:**` field citing the git source-of-truth';
    case 'repo-path-renamed':
      return 'neutralized repo-internal path reference(s) — git source-of-truth is not mirrored';
  }
}

/** Build a typed source-loss entry (message derived deterministically from the mode + subjects). */
export function sourceLoss(mode: SourceLossMode, subjects: readonly string[] = []): SourceLoss {
  return { mode, subjects: [...subjects], message: sourceLossMessage(mode, subjects) };
}
