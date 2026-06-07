/**
 * Whether a write to this path must be blocked: anything under the wiki's
 * immutable `raw/` source folder, or a LikeC4 `.snap` snapshot. Pure.
 */
export function isProtectedWritePath(p: string): boolean {
  const posix = p.split('\\').join('/');
  if (posix.endsWith('.snap')) return true;
  return /(^|\/)docs\/architecture\/raw\//.test(posix);
}

/** Resolve a relative posix path against a base folder (handles `.` and `..`). Pure. */
export function posixResolve(base: string, rel: string): string {
  const parts = (base ? base.split('/') : []).concat(rel.split('/'));
  const stack: string[] = [];
  for (const p of parts) {
    if (p === '' || p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return stack.join('/');
}
