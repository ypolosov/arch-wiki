function between(start: string, end: string, body: string): string {
  return body ? `${start}\n${body}\n${end}` : `${start}\n${end}`;
}

/** Insertion point when markers are absent: after the first H1, else after frontmatter, else top. */
function anchorIndex(lines: string[]): number {
  const h1 = lines.findIndex((l) => /^#\s/.test(l));
  if (h1 >= 0) return h1 + 1;
  if (lines[0] === '---') {
    const close = lines.indexOf('---', 1);
    if (close >= 0) return close + 1;
  }
  return 0;
}

/**
 * Deterministically replace a marker-delimited managed region (precedent:
 * SyncTemplates curated-preservation). Content OUTSIDE the markers is preserved
 * verbatim. An empty `body` yields an empty region — never a file deletion. When
 * the file is absent it is created from `newFileScaffold`; when it exists but lacks
 * markers the region is inserted at a deterministic anchor (never a silent append).
 * Pure, no throw.
 */
export function replaceManagedRegion(
  content: string | null,
  startMark: string,
  endMark: string,
  body: string,
  newFileScaffold: string,
): string {
  const region = between(startMark, endMark, body);
  if (content == null) {
    const sep = newFileScaffold.endsWith('\n') ? '' : '\n';
    return `${newFileScaffold}${sep}${region}\n`;
  }
  const s = content.indexOf(startMark);
  const e = content.indexOf(endMark);
  if (s >= 0 && e >= 0 && e > s) {
    return `${content.slice(0, s)}${region}${content.slice(e + endMark.length)}`;
  }
  const lines = content.split('\n');
  lines.splice(anchorIndex(lines), 0, '', region, '');
  const out = lines.join('\n');
  return out.endsWith('\n') ? out : `${out}\n`;
}
