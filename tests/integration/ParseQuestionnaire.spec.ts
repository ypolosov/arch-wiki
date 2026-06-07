import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { parseQuestionnaire } from '../../src/application/usecases/ParseQuestionnaire';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-pq-'));
  return path.join(dir, 'docs/architecture');
}

const ANSWERED = `---
method: qaw
related_drivers: [QA-003, QA-004]
status: answered
---

# Опросник QAW: Latency

## Сценарии качества
p99 < 200ms под нагрузкой 1000 rps.
closes: QA-003

## Приоритизация
Высокий приоритет.
contradiction: QA-004 conflicts with the cost constraint CON-002
`;

describe('parseQuestionnaire (integration)', () => {
  it('attributes answers to drivers and computes unanswered', async () => {
    const root = await tmpRoot();
    const repo = new FoamWikiRepository(root, new NodeFileSystem());
    const rel = 'raw/questionnaires/qaw-2026-06-08-latency.md';
    await repo.write(rel, ANSWERED);

    const r = await parseQuestionnaire({ from: rel }, { repo });
    expect(r.method).toBe('qaw');
    expect(r.relatedDrivers).toEqual(['QA-003', 'QA-004']);
    expect(r.answers).toEqual([{ section: 'Сценарии качества', closesDriver: 'QA-003' }]);
    expect(r.unanswered).toEqual(['QA-004']);
    expect(r.contradictions).toHaveLength(1);
    expect(r.contradictions[0]!.conflict).toContain('CON-002');
  });

  it('rejects an unanswered questionnaire (status: open → exit 2)', async () => {
    const root = await tmpRoot();
    const repo = new FoamWikiRepository(root, new NodeFileSystem());
    const rel = 'raw/questionnaires/open.md';
    await repo.write(rel, '---\nmethod: qaw\nrelated_drivers: [QA-1]\nstatus: open\n---\n# Q\n');
    await expect(parseQuestionnaire({ from: rel }, { repo })).rejects.toMatchObject({ exitCode: 2 });
  });

  it('rejects a --from outside raw/ (exit 2) and a missing --from (exit 1)', async () => {
    const root = await tmpRoot();
    const repo = new FoamWikiRepository(root, new NodeFileSystem());
    await expect(parseQuestionnaire({ from: 'concepts/x.md' }, { repo })).rejects.toMatchObject({ exitCode: 2 });
    await expect(parseQuestionnaire({ from: '' }, { repo })).rejects.toMatchObject({ exitCode: 1 });
  });

  it('rejects a questionnaire-shaped frontmatter missing method (exit 2)', async () => {
    const root = await tmpRoot();
    const repo = new FoamWikiRepository(root, new NodeFileSystem());
    const rel = 'raw/questionnaires/broken.md';
    await repo.write(rel, '---\nstatus: answered\nrelated_drivers: [QA-1]\n---\n# Q\ncloses: QA-1\n');
    await expect(parseQuestionnaire({ from: rel }, { repo })).rejects.toMatchObject({ exitCode: 2 });
  });

  it('treats a frontmatter-less raw file softly ({} → method null)', async () => {
    const root = await tmpRoot();
    const repo = new FoamWikiRepository(root, new NodeFileSystem());
    const rel = 'raw/questionnaires/notes.md';
    await repo.write(rel, '# Just notes\ncloses: QA-9\n');
    const r = await parseQuestionnaire({ from: rel }, { repo });
    expect(r.method).toBeNull();
    expect(r.relatedDrivers).toEqual([]);
    expect(r.answers).toEqual([{ section: 'Just notes', closesDriver: 'QA-9' }]);
  });
});
