import { deepMerge } from '../../src/domain/services/DeepMerge';

describe('deepMerge', () => {
  it('override wins over base for scalars', () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });

  it('merges nested plain objects recursively', () => {
    expect(deepMerge({ x: { p: 1, q: 2 } }, { x: { q: 9, r: 3 } })).toEqual({
      x: { p: 1, q: 9, r: 3 },
    });
  });

  it('replaces arrays wholesale (never concatenates)', () => {
    expect(deepMerge({ tags: ['a', 'b'] }, { tags: ['c'] })).toEqual({ tags: ['c'] });
  });

  it('adds keys absent from base', () => {
    expect(deepMerge({ type: 'concept' }, { status: 'hypothesis' })).toEqual({
      type: 'concept',
      status: 'hypothesis',
    });
  });

  it('does not mutate its inputs', () => {
    const base = { x: { p: 1 } };
    const over = { x: { q: 2 } };
    deepMerge(base, over);
    expect(base).toEqual({ x: { p: 1 } });
    expect(over).toEqual({ x: { q: 2 } });
  });

  it('an array in base replaced by a scalar override (and vice-versa)', () => {
    expect(deepMerge({ a: [1, 2] }, { a: 5 })).toEqual({ a: 5 });
    expect(deepMerge({ a: 5 }, { a: [1, 2] })).toEqual({ a: [1, 2] });
  });
});
