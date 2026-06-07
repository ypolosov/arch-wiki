export interface KeyedTableSpec {
  /** Full file content for a brand-new file; must end with the table header rows. */
  scaffold: string;
  /** Substring identifying the header row (e.g. `| Card |`). */
  headerMark: string;
  /** The 2-line markdown header+separator to insert if an existing file lacks the table. */
  header: string;
}

export interface UpsertResult {
  content: string;
  /** False when the row was already present and identical (idempotent no-op). */
  changed: boolean;
}

/**
 * Deterministic keyed-row upsert over a markdown table (precedent: RecordRisk).
 * `keyLine` is a substring uniquely identifying a row. If a line containing it
 * exists, the row is replaced (changed iff different); otherwise the row is
 * appended. A null `content` creates the file from `spec.scaffold`. Everything
 * outside the matched row is preserved. Pure, no throw.
 */
export function upsertKeyedRow(
  content: string | null,
  keyLine: string,
  row: string,
  spec: KeyedTableSpec,
): UpsertResult {
  if (content == null) {
    return { content: `${spec.scaffold}${row}\n`, changed: true };
  }
  const lines = content.split('\n');
  const idx = lines.findIndex((l) => l.includes(keyLine));
  if (idx >= 0) {
    if (lines[idx] === row) return { content, changed: false };
    lines[idx] = row;
    return { content: lines.join('\n'), changed: true };
  }
  const base = content.length === 0 || content.endsWith('\n') ? content : `${content}\n`;
  const next = content.includes(spec.headerMark) ? `${base}${row}\n` : `${base}\n${spec.header}${row}\n`;
  return { content: next, changed: true };
}
