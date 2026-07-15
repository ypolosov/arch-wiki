import { verifyMirror } from '../../src/domain/services/VerifyMirror';

describe('verifyMirror', () => {
  it('passes a clean mirror (humanized phrases, no repo paths)', () => {
    const r = verifyMirror([{ source: 'a.md', body: 'Tracked in the risk register; Keycloak owns identity.' }]);
    expect(r.ok).toBe(true);
    expect(r.checked).toBe(1);
    expect(r.violations).toEqual([]);
  });

  it('flags a repo-path/register leak in the body', () => {
    const r = verifyMirror([{ source: 'a.md', body: 'tracked in risks.md today' }]);
    expect(r.ok).toBe(false);
    expect(r.violations[0]).toMatchObject({ page: 'a.md', where: 'body' });
    expect(r.violations[0]!.leaks).toContain('risks.md');
  });

  it('flags a leak that survived into a RU-mask restore value', () => {
    const r = verifyMirror([{ source: 'a.md', body: 'clean', restore: [{ original: 'derived from raw/notes.md' }] }]);
    expect(r.ok).toBe(false);
    expect(r.violations[0]!.where).toBe('restore');
    expect(r.violations[0]!.leaks.some((l) => l.startsWith('raw/'))).toBe(true);
  });

  it('keeps external/POC git URLs (acceptance tier ii)', () => {
    const r = verifyMirror([{ source: 'a.md', body: 'POC at https://bitbucket.org/acme/repo and git.shakuro.com/x' }]);
    expect(r.ok).toBe(true);
  });
});
