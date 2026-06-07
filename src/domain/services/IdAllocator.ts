import { DomainError } from '../errors';
import { ArtifactId } from '../model/ArtifactId';
import { ArtifactSpec } from '../model/ArtifactType';

/** Next sequential number given the existing numbers (max + 1, or 1 if none). */
export function nextNumber(existing: readonly number[]): number {
  let max = 0;
  for (const n of existing) if (n > max) max = n;
  return max + 1;
}

/** Allocate the next {@link ArtifactId} for a numbered artifact kind. */
export function nextId(spec: ArtifactSpec, existing: readonly number[]): ArtifactId {
  if (!spec.prefix) {
    throw new DomainError(`artifact kind "${spec.kind}" has no numeric id scheme`, 1);
  }
  return new ArtifactId(spec.prefix, nextNumber(existing), spec.pad);
}
