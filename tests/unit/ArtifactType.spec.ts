import { ARTIFACT_SPECS, resolveKind } from '../../src/domain/model/ArtifactType';
import { ArtifactId } from '../../src/domain/model/ArtifactId';

describe('ARTIFACT_SPECS', () => {
  it('builds driver filenames with prefix', () => {
    const spec = ARTIFACT_SPECS['quality-attribute'];
    const id = new ArtifactId('QA', 3, 3);
    expect(spec.filename(id, 'api-response-time')).toBe('QA-003-api-response-time.md');
  });

  it('builds ADR filename without prefix (4-digit)', () => {
    const spec = ARTIFACT_SPECS['adr'];
    const id = new ArtifactId('ADR', 23, 4);
    expect(spec.filename(id, 'use-kafka')).toBe('0023-use-kafka.md');
  });

  it('builds iteration filename without slug', () => {
    const spec = ARTIFACT_SPECS['iteration'];
    const id = new ArtifactId('ITER', 4, 2);
    expect(spec.filename(id, 'ignored')).toBe('ITER-04.md');
  });

  it('builds concept filename from slug only', () => {
    const spec = ARTIFACT_SPECS['concept'];
    expect(spec.filename(null, 'release-management')).toBe('release-management.md');
  });

  it('resolveKind accepts aliases and canonical names', () => {
    expect(resolveKind('qa').kind).toBe('quality-attribute');
    expect(resolveKind('ADR').kind).toBe('adr');
    expect(resolveKind('use-case').kind).toBe('use-case');
    expect(resolveKind('iter').kind).toBe('iteration');
  });

  it('resolveKind throws on unknown token', () => {
    expect(() => resolveKind('nope')).toThrow();
  });
});
