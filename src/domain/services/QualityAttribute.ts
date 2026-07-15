import { LintFinding } from './LintRuleSet';

/**
 * Extract the QA scenario **Measure** text from a page body (FPF C.16 / A.18). A
 * measure is authored either as a Scenario table row (`| **Measure** | … |`) or a
 * bold label (`- **Measure:** …`). Returns the measure text, or `null` if none is
 * stated. Deterministic; no I/O.
 */
export function extractMeasure(content: string): string | null {
  for (const line of content.split('\n')) {
    const tbl = line.match(/^\s*\|\s*\*{0,2}\s*measure\s*\*{0,2}\s*\|(.+?)\|/i);
    if (tbl) return tbl[1]!.trim();
    const lbl = line.match(/^\s*-?\s*\*\*\s*measure\s*:?\s*\*\*\s*(.*)$/i);
    if (lbl) return lbl[1]!.trim();
  }
  return null;
}

/**
 * Flag only a **short, vacuous** Measure — a wish like "fast and reliable" with no
 * numeric threshold and no comparison operator (FPF C.16 — a Characteristic needs a
 * Scale). Deliberately conservative: a long, detailed qualitative measure (e.g. an
 * idempotence invariant) is testable-but-not-numeric and is left to the LLM
 * adequacy rubric; an empty/absent measure is left to the required-section check.
 */
export function qaMeasureFinding(basename: string, relPath: string, content: string): LintFinding | null {
  const measure = extractMeasure(content);
  if (measure && measure.length <= 40 && !/\d/.test(measure) && !/[<>=≤≥%]/.test(measure)) {
    return {
      rule: 'qa-measure-untestable',
      severity: 'low',
      file: relPath,
      message: `QA ${basename} Measure "${measure}" looks like a wish — no numeric threshold (FPF C.16)`,
    };
  }
  return null;
}
