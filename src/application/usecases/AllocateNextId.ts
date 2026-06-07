import { ArtifactId } from '../../domain/model/ArtifactId';
import { ArtifactSpec } from '../../domain/model/ArtifactType';
import { nextId } from '../../domain/services/IdAllocator';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

/** Allocate the next id for a numbered kind by reading the wiki state. */
export async function allocateNextId(
  spec: ArtifactSpec,
  repo: WikiRepositoryPort,
): Promise<ArtifactId> {
  const existing = await repo.existingNumbers(spec);
  return nextId(spec, existing);
}
