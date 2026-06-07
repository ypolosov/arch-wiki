import { nextNumber, nextId } from '../../src/domain/services/IdAllocator';
import { ARTIFACT_SPECS } from '../../src/domain/model/ArtifactType';

describe('IdAllocator', () => {
  it('nextNumber is max+1, or 1 when empty', () => {
    expect(nextNumber([])).toBe(1);
    expect(nextNumber([1, 5, 3])).toBe(6);
    expect(nextNumber([7])).toBe(8);
  });

  it('is order-independent (deterministic regardless of input order)', () => {
    expect(nextNumber([3, 1, 5])).toBe(nextNumber([5, 3, 1]));
  });

  it('allocates padded ids per spec', () => {
    expect(nextId(ARTIFACT_SPECS['quality-attribute'], [1, 2]).toString()).toBe('QA-003');
    expect(nextId(ARTIFACT_SPECS['adr'], [22]).toString()).toBe('ADR-0023');
    expect(nextId(ARTIFACT_SPECS['iteration'], []).toString()).toBe('ITER-01');
  });

  it('throws for unnumbered kinds', () => {
    expect(() => nextId(ARTIFACT_SPECS['concept'], [])).toThrow();
    expect(() => nextId(ARTIFACT_SPECS['entity'], [])).toThrow();
  });
});
