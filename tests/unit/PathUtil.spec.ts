import { isProtectedWritePath, posixResolve } from '../../src/domain/services/PathUtil';

describe('isProtectedWritePath', () => {
  it('blocks raw/ writes and .snap snapshots', () => {
    expect(isProtectedWritePath('/x/docs/architecture/raw/notes.md')).toBe(true);
    expect(isProtectedWritePath('docs/architecture/raw/a.md')).toBe(true);
    expect(isProtectedWritePath('/x/docs/architecture/c4/.likec4/views.snap')).toBe(true);
  });

  it('allows normal Layer-2 writes', () => {
    expect(isProtectedWritePath('/x/docs/architecture/adrs/0001-x.md')).toBe(false);
    expect(isProtectedWritePath('docs/architecture/drivers/use-cases/UC-001-x.md')).toBe(false);
  });
});

describe('posixResolve', () => {
  it('resolves relative segments against a base folder', () => {
    expect(posixResolve('drivers/use-cases', '../../adrs/0001.md')).toBe('adrs/0001.md');
    expect(posixResolve('', 'raw/README.md')).toBe('raw/README.md');
    expect(posixResolve('a/b', './c.md')).toBe('a/b/c.md');
  });
});
