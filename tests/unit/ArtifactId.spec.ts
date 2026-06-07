import { ArtifactId } from '../../src/domain/model/ArtifactId';

describe('ArtifactId', () => {
  it('formats with zero-padding', () => {
    expect(new ArtifactId('QA', 7, 3).toString()).toBe('QA-007');
    expect(new ArtifactId('ADR', 23, 4).toString()).toBe('ADR-0023');
    expect(new ArtifactId('ITER', 4, 2).toString()).toBe('ITER-04');
  });

  it('exposes the padded number', () => {
    expect(new ArtifactId('ADR', 5, 4).padded).toBe('0005');
  });

  it('parses round-trip', () => {
    const id = ArtifactId.parse('QA-007');
    expect(id).not.toBeNull();
    expect(id!.prefix).toBe('QA');
    expect(id!.num).toBe(7);
    expect(id!.pad).toBe(3);
    expect(id!.toString()).toBe('QA-007');
  });

  it('returns null for non-matching strings', () => {
    expect(ArtifactId.parse('not-an-id')).toBeNull();
    expect(ArtifactId.parse('0007-foo')).toBeNull();
    expect(ArtifactId.parse('qa-007')).toBeNull();
  });

  it('rejects invalid constructor input', () => {
    expect(() => new ArtifactId('qa', 1, 3)).toThrow();
    expect(() => new ArtifactId('QA', -1, 3)).toThrow();
    expect(() => new ArtifactId('QA', 1, 0)).toThrow();
  });
});
