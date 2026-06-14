/**
 * Tiny pure semver helpers — used to warn when a newer plugin version is installed on
 * disk than the one the running CLI was bundled as (the PATH binary resolves at session
 * start, so `claude plugin update` does not take effect until restart). Comparison only;
 * no I/O.
 */

/** Parse a leading `X.Y.Z` → `[X,Y,Z]`; anything else (e.g. `"unknown"`) → null. */
export function parseSemver(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** True iff `candidate` is a strictly higher semver than `current` (both must parse). */
export function isNewerVersion(candidate: string, current: string): boolean {
  const a = parseSemver(candidate);
  const b = parseSemver(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i]! > b[i]!;
  }
  return false;
}
