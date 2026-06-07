function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deterministic deep merge: `override` wins over `base`. Nested plain objects are
 * merged recursively; arrays and scalars are replaced wholesale (never
 * concatenated) so the result is byte-stable. Pure, never throws. Key ordering of
 * the output is irrelevant — {@link GrayMatterParser.stringify} sorts keys deeply
 * before serialization.
 */
export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = out[key];
    out[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o) : o;
  }
  return out;
}
