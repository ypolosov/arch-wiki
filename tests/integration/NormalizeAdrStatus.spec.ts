import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { normalizeAdrStatuses } from '../../src/application/usecases/NormalizeAdrStatus';

const ADR = (status: string) =>
  [
    '---',
    'type: adr',
    `status: ${status}`,
    'tags:',
    '  - adr',
    `  - adr/${status}`,
    '---',
    '',
    '# ADR-0004: Configs',
    '',
    '## Decision Outcome',
    'Use ConfigMaps. This prose is the DECISION and must never be rewritten.',
    '',
  ].join('\n');

async function wiki(files: Record<string, string>): Promise<FoamWikiRepository> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-nas-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  for (const [rel, body] of Object.entries(files)) await sys.writeFile(path.join(root, rel), body);
  return new FoamWikiRepository(root, sys);
}

describe('normalizeAdrStatuses', () => {
  it('reports the mapping WITHOUT writing by default', async () => {
    const repo = await wiki({ 'adrs/0004-configs.md': ADR('partially') });
    const before = await repo.read('adrs/0004-configs.md');

    const r = await normalizeAdrStatuses(repo);
    expect(r.written).toBe(false);
    expect(r.changes).toHaveLength(1);
    expect(r.changes[0]).toMatchObject({ basename: '0004-configs', from: 'partially', to: 'accepted' });
    expect(r.changes[0]!.note).toMatch(/tech-debt/);
    expect(await repo.read('adrs/0004-configs.md')).toBe(before); // untouched
  });

  it('--write updates the status AND the tag, and nothing else', async () => {
    const repo = await wiki({ 'adrs/0004-configs.md': ADR('partially') });
    const r = await normalizeAdrStatuses(repo, { write: true });
    expect(r.written).toBe(true);

    const after = await repo.read('adrs/0004-configs.md');
    expect(after).toContain('status: accepted');
    expect(after).toContain('- adr/accepted');
    expect(after).not.toContain('partially');
    // the decision's prose is byte-identical — the record is mutable, the decision is not
    expect(after).toContain('Use ConfigMaps. This prose is the DECISION and must never be rewritten.');
    expect(after).toContain('# ADR-0004: Configs');
  });

  it('is idempotent — a second run is a no-op', async () => {
    const repo = await wiki({ 'adrs/0004-configs.md': ADR('partially') });
    await normalizeAdrStatuses(repo, { write: true });
    const afterFirst = await repo.read('adrs/0004-configs.md');

    const second = await normalizeAdrStatuses(repo, { write: true });
    expect(second.changes).toEqual([]);
    expect(second.idempotent).toBe(true);
    expect(await repo.read('adrs/0004-configs.md')).toBe(afterFirst);
  });

  it('REFUSES to guess an unmapped status — reports it instead', async () => {
    const repo = await wiki({ 'adrs/0009-x.md': ADR('whatever') });
    const before = await repo.read('adrs/0009-x.md');
    const r = await normalizeAdrStatuses(repo, { write: true });
    expect(r.changes).toEqual([]);
    expect(r.unmapped).toEqual([{ file: 'adrs/0009-x.md', basename: '0009-x', status: 'whatever' }]);
    expect(await repo.read('adrs/0009-x.md')).toBe(before); // never guessed
  });

  it('leaves canonical statuses and the template slot alone', async () => {
    const repo = await wiki({
      'adrs/0001-ok.md': ADR('accepted'),
      'adrs/0000-template.md': ADR('partially'), // a skeleton is never a decision
    });
    const r = await normalizeAdrStatuses(repo, { write: true });
    expect(r.changes).toEqual([]);
    expect(r.unmapped).toEqual([]);
    expect(r.idempotent).toBe(true);
  });
});
