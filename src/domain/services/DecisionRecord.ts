import { LintFinding } from './LintRuleSet';

/**
 * State of an ADR's `## Considered Options` section (FPF C.32.ADA — a decision needs a
 * live candidate set). Format-agnostic on purpose: options are authored as numbered
 * lists, bold bullets, OR tables across real ADRs, so ANY non-blank, non-comment content
 * counts as `filled`. Only a heading with no substance is `empty`. `absent` (no heading)
 * is left to the adequacy `options` base, never double-flagged. Deterministic; no I/O.
 */
export function optionsSectionState(content: string): 'absent' | 'empty' | 'filled' {
  let inSection = false;
  let found = false;
  let hasContent = false;
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (/^##\s+considered\s+options\b/i.test(t)) {
      inSection = true;
      found = true;
      continue;
    }
    if (inSection && /^##\s/.test(t)) break; // next top-level section
    if (inSection && t && !t.startsWith('<!--')) hasContent = true;
  }
  if (!found) return 'absent';
  return hasContent ? 'filled' : 'empty';
}

/**
 * `adr-options-empty` (low, FPF C.32.ADA): an ACCEPTED ADR whose `## Considered Options`
 * section is present but empty — a decision recorded with no candidate set at all.
 * Robust to any option format (table / bullet / numbered), so it never false-flags a
 * filled section; an ABSENT section is the adequacy base's job.
 */
export function adrOptionsEmptyFinding(
  basename: string,
  relPath: string,
  status: string,
  content: string,
): LintFinding | null {
  if (status.toLowerCase() !== 'accepted') return null;
  if (optionsSectionState(content) === 'empty') {
    return {
      rule: 'adr-options-empty',
      severity: 'low',
      file: relPath,
      message: `accepted ADR ${basename} has an empty Considered Options section — no candidate set (FPF C.32.ADA)`,
    };
  }
  return null;
}
