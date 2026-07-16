import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CLI = path.resolve(__dirname, '../../dist/cli.cjs');

interface Envelope {
  ok: boolean;
  command: string;
  data: Record<string, unknown>;
  warnings?: string[];
}

function run(args: string[], cwd: string): Envelope {
  const out = execFileSync('node', [CLI, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ARCH_WIKI_NOW: '2026-06-07T00:00:00Z' },
  });
  const lastLine = out.trim().split('\n').pop()!;
  return JSON.parse(lastLine) as Envelope;
}

describe('arch-wiki CLI (e2e, built bundle)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-e2e-'));
  });

  it('doctor reports the bundled templates are present', () => {
    const env = run(['doctor'], root);
    expect(env.ok).toBe(true);
    expect(env.data.templatesPresent).toBe(true);
  });

  it('scaffolds an ADR deterministically', async () => {
    const env = run(['scaffold', 'adr', '--title', 'Use Kafka', '--cwd', root], root);
    expect(env.ok).toBe(true);
    expect(env.data.id).toBe('ADR-0001');
    expect(env.data.path).toBe('adrs/0001-use-kafka.md');
    const content = await fs.readFile(
      path.join(root, 'docs/architecture/adrs/0001-use-kafka.md'),
      'utf8',
    );
    expect(content).toContain('# ADR-0001: Use Kafka');
    expect(content).toContain('**Date:** 2026-06-07');
  });

  it('allocates the next id after a scaffold', () => {
    run(['scaffold', 'qa', '--title', 'One', '--cwd', root], root);
    const env = run(['next-id', 'qa', '--cwd', root], root);
    expect(env.data.id).toBe('QA-002');
  });

  it('lint exits 2 and reports a broken md-link', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, 'adrs'), { recursive: true });
    await fs.writeFile(path.join(wiki, 'index.md'), '# Index\n[ghost](adrs/0099-ghost.md)\n');

    let exitCode = 0;
    let stdout = '';
    try {
      stdout = execFileSync('node', [CLI, 'lint', '--json', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch (e: unknown) {
      const err = e as { status: number; stdout: string };
      exitCode = err.status;
      stdout = err.stdout;
    }
    expect(exitCode).toBe(2);
    const env = JSON.parse(stdout.trim().split('\n').pop()!) as Envelope;
    const findings = env.data.findings as Array<{ rule: string }>;
    expect(findings.some((f) => f.rule === 'broken-mdlink')).toBe(true);
  });

  it('sync-templates: check exits 2 when foam templates are missing; --force creates them', async () => {
    let exitCode = 0;
    let stdout = '';
    try {
      stdout = execFileSync('node', [CLI, 'sync-templates', '--cwd', root], { cwd: root, encoding: 'utf8' });
    } catch (e: unknown) {
      const err = e as { status: number; stdout: string };
      exitCode = err.status;
      stdout = err.stdout;
    }
    expect(exitCode).toBe(2);
    // Drift is reported (exit 2 = CI gate) but the command itself succeeded.
    const checkEnv = JSON.parse(stdout.trim().split('\n').pop()!) as Envelope;
    expect(checkEnv.ok).toBe(true);
    expect((checkEnv.data as { drift: boolean }).drift).toBe(true);

    const env = run(['sync-templates', '--force', '--cwd', root], root);
    expect(env.ok).toBe(true);
    expect((env.data.wrote as string[]).length).toBeGreaterThan(0);
    const adr = await fs.readFile(
      path.join(root, 'docs/architecture/.foam/templates/adr.md'),
      'utf8',
    );
    expect(adr).toContain('arch-wiki:template sha256=');
  });

  it('record-risk writes an idempotent row into risks.md', async () => {
    const env = run(
      ['record-risk', '--source', 'ingest', '--id', 'QA-007', '--conflict', 'clash', '--cwd', root],
      root,
    );
    expect(env.ok).toBe(true);
    expect(env.data.created).toBe(true);

    const again = run(
      ['record-risk', '--source', 'ingest', '--id', 'QA-007', '--conflict', 'clash', '--cwd', root],
      root,
    );
    expect(again.data.created).toBe(false);

    const content = await fs.readFile(path.join(root, 'docs/architecture/risks.md'), 'utf8');
    expect(content).toContain('clash');
  });

  it('config: ok on a wiki with no profile; exit 2 on an invalid profile', async () => {
    const env = run(['config', '--cwd', root], root);
    expect(env.ok).toBe(true);
    expect((env.data as { present: boolean }).present).toBe(false);

    await fs.mkdir(path.join(root, 'docs/architecture/.arch-wiki'), { recursive: true });
    await fs.writeFile(
      path.join(root, 'docs/architecture/.arch-wiki/config.json'),
      JSON.stringify({ bogus: 1 }), // strict schema → unknown key
    );
    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync('node', [CLI, 'config', '--cwd', root], { cwd: root, encoding: 'utf8' });
    } catch (e: unknown) {
      const err = e as { status: number; stderr: string };
      exitCode = err.status;
      stderr = err.stderr;
    }
    expect(exitCode).toBe(2);
    expect(JSON.parse(stderr.trim()).ok).toBe(false);
  });

  it('process chain: hypothesis (+kanban, not orphan) → questionnaire → trace', async () => {
    const hyp = run(['hypothesis', '--title', 'Edge Caching', '--cwd', root], root);
    expect(hyp.ok).toBe(true);
    expect(hyp.data.path).toBe('concepts/hypothesis-edge-caching.md');
    expect(hyp.data.kanbanCard).toBe('hypothesis-edge-caching');

    const wiki = path.join(root, 'docs/architecture');
    const kanban = await fs.readFile(path.join(wiki, 'kanban.md'), 'utf8');
    expect(kanban).toContain('[[hypothesis-edge-caching]]');

    // The hypothesis is not an orphan (kanban card supplies inbound link).
    let lintOut = '';
    try {
      lintOut = execFileSync('node', [CLI, 'lint', '--json', '--cwd', root], { cwd: root, encoding: 'utf8' });
    } catch (e: unknown) {
      lintOut = (e as { stdout: string }).stdout;
    }
    const lint = JSON.parse(lintOut.trim().split('\n').pop()!) as Envelope;
    const orphans = (lint.data.findings as Array<{ rule: string; file?: string }>).filter(
      (f) => f.rule === 'orphan' && f.file === 'concepts/hypothesis-edge-caching.md',
    );
    expect(orphans).toHaveLength(0);

    const q = run(['questionnaire', 'qaw', '--topic', 'Checkout', '--cwd', root], root);
    expect(q.ok).toBe(true);
    expect(q.data.path).toBe('raw/questionnaires/qaw-2026-06-07-checkout.md');
  });

  it('render-issue + record-issue + trace with a tasks profile', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, '.arch-wiki'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, '.arch-wiki/config.json'),
      JSON.stringify({ tasks: { language: 'ru', prefixes: { arch: '[Arch]', techdesign: '[Techdesign]' } } }),
    );
    await fs.mkdir(path.join(wiki, 'drivers/quality-attributes'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\n---\n# QA-001: Latency\n',
    );

    const env = run(['render-issue', '--from', 'QA-001', '--kind', 'arch', '--cwd', root], root);
    expect(env.ok).toBe(true);
    expect(env.data.issueTitle).toBe('[Arch] Latency');
    expect(env.data.alreadyCreated).toBe(false);
    const hash = env.data.contentHash as string;

    const rec = run(
      ['record-issue', '--id', 'QA-001', '--key', 'GRM-431', '--kind', 'arch', '--hash', hash, '--cwd', root],
      root,
    );
    expect((rec.data as { ledgerAppended: boolean }).ledgerAppended).toBe(true);

    const again = run(['render-issue', '--from', 'QA-001', '--kind', 'arch', '--cwd', root], root);
    expect(again.data.alreadyCreated).toBe(true);
    expect(again.data.drifted).toBe(false);

    const tr = run(['trace', 'QA-001', '--cwd', root], root);
    expect((tr.data.issues as Array<{ key: string }>)[0]!.key).toBe('GRM-431');
  });

  it('books-plan renders a local-rag-pinned plan; ingest --enrich writes Related Patterns', async () => {
    const plan = run(['books-plan', 'enrich', '--drivers', 'QA-007', '--cwd', root], root);
    expect(plan.ok).toBe(true);
    expect((plan.data as { corpus: string }).corpus).toBe('local-rag');
    expect((plan.data as { optional: boolean }).optional).toBe(true);

    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, 'drivers/quality-attributes'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, 'drivers/quality-attributes/QA-007-caching.md'),
      '---\ntype: quality-attribute\n---\n# QA-007: Caching\n',
    );
    const answers = JSON.stringify([
      { key: 'enrich:QA-007', hits: [{ source: 'arc42.pdf', score: 0.9, excerpt: 'cache aside' }] },
    ]);
    const env = run(['ingest', '--enrich', '--rag-results', answers, '--cwd', root], root);
    expect(env.ok).toBe(true);
    const content = await fs.readFile(path.join(wiki, 'drivers/quality-attributes/QA-007-caching.md'), 'utf8');
    expect(content).toContain('## Related Patterns');
    expect(content).toContain('arc42.pdf');
  });

  it('ingest --enrich with malformed --rag-results exits 2', () => {
    let exitCode = 0;
    try {
      execFileSync('node', [CLI, 'ingest', '--enrich', '--rag-results', 'not-json', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch (e: unknown) {
      exitCode = (e as { status: number }).status;
    }
    expect(exitCode).toBe(2);
  });

  it('fails with a JSON error and non-zero exit on unknown type', () => {
    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync('node', [CLI, 'scaffold', 'nope', '--title', 'x', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch (e: unknown) {
      const err = e as { status: number; stderr: string };
      exitCode = err.status;
      stderr = err.stderr;
    }
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr.trim()).ok).toBe(false);
  });

  it('validate-c4 via stdin: requireDocumentation is opt-in; once configured, drift exits 2', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, 'entities'), { recursive: true });
    await fs.writeFile(path.join(wiki, 'entities/backend.md'), '---\ntype: entity\n---\n# Backend\n');

    // `cloud.db` has no wiki entity; `cloud.backend` matches entities/backend.md by name.
    const drift = JSON.stringify({
      elements: [
        { id: 'cloud.backend', kind: 'container', title: 'Backend' },
        { id: 'cloud.db', kind: 'container', title: 'Database' },
      ],
    });

    // 1. No [c4.consistency] → requireDocumentation is OPT-IN (default []): the plugin does NOT
    //    demand a wiki page per model element, so the undocumented container is not reported.
    const optOut = execFileSync('node', [CLI, 'validate-c4', '--stdin', '--cwd', root], {
      cwd: root,
      encoding: 'utf8',
      input: drift,
    });
    const optOutEnv = JSON.parse(optOut.trim().split('\n').pop()!) as Envelope;
    expect(optOutEnv.ok).toBe(true);
    expect((optOutEnv.data.findings as unknown[]).length).toBe(0);

    // 2. The project opts in explicitly → the same model now reports the undocumented container.
    await fs.mkdir(path.join(wiki, '.arch-wiki'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, '.arch-wiki/config.json'),
      JSON.stringify({
        c4: { dir: 'c4/src', validate: 'true', consistency: { requireDocumentation: ['container'] } },
      }),
    );
    let exitCode = 0;
    let stdout = '';
    try {
      stdout = execFileSync('node', [CLI, 'validate-c4', '--stdin', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
        input: drift,
      });
    } catch (e: unknown) {
      const err = e as { status: number; stdout: string };
      exitCode = err.status;
      stdout = err.stdout;
    }
    expect(exitCode).toBe(2);
    const env = JSON.parse(stdout.trim().split('\n').pop()!) as Envelope;
    const findings = env.data.findings as Array<{ rule: string; message: string }>;
    expect(findings.some((f) => f.rule === 'c4-element-without-wiki-entity' && f.message.includes('cloud.db'))).toBe(true);
  });

  it('validate-c4 accepts the raw `likec4 export json` ARRAY piped straight in', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(wiki, { recursive: true });
    // The real CLI emits an array of project models; piping it raw used to yield an EMPTY model.
    const raw = JSON.stringify([
      {
        _stage: 'layouted',
        projectId: 'demo',
        elements: { 'cloud.backend': { id: 'cloud.backend', kind: 'container', title: 'Backend' } },
        relations: { r1: { id: 'r1', source: { model: 'cloud.backend' }, target: { model: 'cloud.backend' }, title: 'self' } },
        views: { index: { id: 'index', title: 'Index', nodes: [{ id: 'n', modelRef: 'cloud.backend' }] } },
      },
    ]);
    const out = execFileSync('node', [CLI, 'validate-c4', '--stdin', '--cwd', root], {
      cwd: root,
      encoding: 'utf8',
      input: raw,
    });
    const env = JSON.parse(out.trim().split('\n').pop()!) as Envelope;
    expect(env.ok).toBe(true);
    expect(env.data.elementCount).toBe(1);
    expect(env.data.relationshipCount).toBe(1);
    expect(env.data.viewCount).toBe(1);
  });

  it('validate-c4 --source regex without a [c4] config exits 2 with a self-explanatory hint', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(wiki, { recursive: true });
    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync('node', [CLI, 'validate-c4', '--source', 'regex', '--cwd', root], { cwd: root, encoding: 'utf8' });
    } catch (e: unknown) {
      const err = e as { status: number; stderr: string };
      exitCode = err.status;
      stderr = err.stderr;
    }
    expect(exitCode).toBe(2);
    // The error names this command and the minimal fix — not the generic cartographer message.
    expect(stderr).toContain('validate-c4 --source regex needs a [c4] config');
    expect(stderr).toContain('--stdin');
  });

  it('CAP-1: pull-stories plan, record-story (stdin) into raw/_synced, idempotent, prune', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, '.arch-wiki'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, '.arch-wiki/config.json'),
      JSON.stringify({ integrations: { upstream: { userStoryLog: { cloudId: 'cid-1', pageId: '16121885' } } } }),
    );

    const plan = run(['pull-stories', '--plan', '--cwd', root], root);
    expect(plan.ok).toBe(true);
    expect((plan.data as { rootPageId: string }).rootPageId).toBe('16121885');

    const rec = JSON.parse(
      execFileSync('node', [CLI, 'record-story', '--page', '777', '--title', 'Brand Login', '--page-version', '3', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
        input: 'As a user I can log in.\n',
      })
        .trim()
        .split('\n')
        .pop()!,
    ) as Envelope;
    expect((rec.data as { written: boolean }).written).toBe(true);
    expect((rec.data as { relPath: string }).relPath).toBe('raw/_synced/user-story-log/777-brand-login.md');
    const snap = await fs.readFile(path.join(wiki, 'raw/_synced/user-story-log/777-brand-login.md'), 'utf8');
    expect(snap).toContain('source: confluence');
    expect(snap).toContain('As a user I can log in.');
    // --page-version is captured (cac reserves --version, so the flag was renamed).
    expect(snap).toContain('version: 3');

    // Idempotent re-pull.
    const again = JSON.parse(
      execFileSync('node', [CLI, 'record-story', '--page', '777', '--title', 'Brand Login', '--page-version', '3', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
        input: 'As a user I can log in.\n',
      })
        .trim()
        .split('\n')
        .pop()!,
    ) as Envelope;
    expect((again.data as { written: boolean }).written).toBe(false);

    // Prune against a live set that no longer contains 777. Plan-by-default: 777 is listed
    // but nothing is deleted.
    const snapPath = path.join(wiki, 'raw/_synced/user-story-log/777-brand-login.md');
    const plannedPrune = run(['prune-stories', '--live', '999', '--cwd', root], root);
    expect((plannedPrune.data as { committed: boolean }).committed).toBe(false);
    expect((plannedPrune.data as { pruned: Array<{ pageId: string }> }).pruned).toEqual([
      { pageId: '777', relPath: 'raw/_synced/user-story-log/777-brand-login.md' },
    ]);
    await expect(fs.access(snapPath)).resolves.toBeUndefined(); // still there

    // --commit actually reconciles it away.
    const pruned = run(['prune-stories', '--live', '999', '--commit', '--cwd', root], root);
    expect((pruned.data as { committed: boolean }).committed).toBe(true);
    expect((pruned.data as { pruned: Array<{ pageId: string }> }).pruned).toEqual([
      { pageId: '777', relPath: 'raw/_synced/user-story-log/777-brand-login.md' },
    ]);
    await expect(fs.access(snapPath)).rejects.toBeTruthy(); // gone
  });

  it('CAP-2: render-confluence mirror plan + record-page idempotency', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, '.arch-wiki'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, '.arch-wiki/config.json'),
      JSON.stringify({ integrations: { confluence: { space: 'PP' } } }),
    );
    await fs.mkdir(path.join(wiki, 'entities'), { recursive: true });
    await fs.writeFile(path.join(wiki, 'index.md'), '# Wiki\n');
    await fs.writeFile(path.join(wiki, 'entities/cache.md'), '# Cache\n');

    const plan = run(['render-confluence', '--all', '--cwd', root], root);
    expect(plan.ok).toBe(true);
    const pages = plan.data.pages as Array<{ source: string; contentHash: string }>;
    const cache = pages.find((p) => p.source === 'entities/cache.md')!;
    expect(cache).toBeTruthy();

    // v0.7.1: record-page --from-plan reads the page's current contentHash from the saved plan
    // (no hand-copied --hash → no stale-hash false drift on pass 2).
    const planFile = path.join(root, 'mirror.json');
    await fs.writeFile(planFile, JSON.stringify(plan));
    const rec = run(
      ['record-page', '--source', 'entities/cache.md', '--page', '4242', '--from-plan', planFile, '--cwd', root],
      root,
    );
    expect((rec.data as { ledgerAppended: boolean }).ledgerAppended).toBe(true);

    const plan2 = run(['render-confluence', '--all', '--cwd', root], root);
    const cache2 = (plan2.data.pages as Array<{ source: string; alreadyPublished: boolean; drifted: boolean }>).find(
      (p) => p.source === 'entities/cache.md',
    )!;
    expect(cache2.alreadyPublished).toBe(true);
    expect(cache2.drifted).toBe(false); // hash recorded from the plan matches → no false drift

    // v0.8: --page on a non-existent source FAILS FAST (exit 2), not a silent empty success.
    let pageExit = 0;
    try {
      execFileSync('node', [CLI, 'render-confluence', '--page', 'entities/nope.md', '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch (e: unknown) {
      pageExit = (e as { status: number }).status;
    }
    expect(pageExit).toBe(2);

    // v0.8.2: render-confluence run from INSIDE docs/architecture (the cwd-trap) FAILS FAST (exit 1)
    // with an actionable wiki-root error, not a confusing "no [integrations.confluence.space]".
    let trapExit = 0;
    let trapErr = '';
    try {
      execFileSync('node', [CLI, 'render-confluence', '--all', '--cwd', path.join(root, 'docs/architecture')], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch (e: unknown) {
      trapExit = (e as { status: number }).status;
      trapErr = String((e as { stderr?: string }).stderr ?? '');
    }
    expect(trapExit).toBe(1);
    expect(trapErr).toContain('wiki root');

    // v0.8: record-page --page-version round-trips into the ledger as ledgerPageVersion (drift baseline).
    run(['record-page', '--source', 'index.md', '--page', '1001', '--from-plan', planFile, '--page-version', '7', '--cwd', root], root);
    const plan3 = run(['render-confluence', '--all', '--cwd', root], root);
    const idx = (plan3.data.pages as Array<{ source: string; ledgerPageVersion: number | null }>).find(
      (p) => p.source === 'index.md',
    )!;
    expect(idx.ledgerPageVersion).toBe(7);

    // v0.8 R3: a non-numeric --page-version FAILS FAST (exit 1), not a silent NaN. Strict decimal:
    // 'v7' and non-decimal numeric literals like '0x10'/'1e3' are all rejected (review M5).
    for (const bad of ['v7', '0x10', '1e3']) {
      let badVerExit = 0;
      try {
        execFileSync('node', [CLI, 'record-page', '--source', 'index.md', '--page', '1001', '--page-version', bad, '--cwd', root], {
          cwd: root,
          encoding: 'utf8',
        });
      } catch (e: unknown) {
        badVerExit = (e as { status: number }).status;
      }
      expect(badVerExit).toBe(1);
    }

    // v0.8 C-2: --page emits the target PLUS its ancestor chain (parent-first), not just the leaf.
    const branch = run(['render-confluence', '--page', 'entities/cache.md', '--cwd', root], root);
    const branchSources = (branch.data.pages as Array<{ source: string }>).map((p) => p.source);
    expect(branchSources).toEqual(['index.md', 'entities/cache.md']); // parent before child
  });

  it('CAP-2 RU: finalize-confluence restores protected spans into a translated body', async () => {
    const wiki = path.join(root, 'docs/architecture');
    await fs.mkdir(path.join(wiki, '.arch-wiki'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, '.arch-wiki/config.json'),
      JSON.stringify({ integrations: { confluence: { space: 'PP', language: 'ru', preserveTerms: ['wager'] } } }),
    );
    await fs.writeFile(path.join(wiki, 'index.md'), '# Wiki\n');
    await fs.mkdir(path.join(wiki, 'drivers/use-cases'), { recursive: true });
    await fs.writeFile(
      path.join(wiki, 'drivers/use-cases/UC-014-login.md'),
      '---\ntype: use-case\n---\n# UC-014: Login\n\nRun `npm test` for UC-014.\n',
    );

    const planFile = path.join(root, 'mirror.json');
    const plan = run(['render-confluence', '--all', '--cwd', root], root);
    expect((plan.data as { language: string }).language).toBe('ru');
    await fs.writeFile(planFile, JSON.stringify(plan));
    const uc = (plan.data.pages as Array<{ source: string; body: string }>).find((p) =>
      p.source.includes('UC-014'),
    )!;
    expect(uc.body).toMatch(/%%AWP\d+%%/); // structural spans masked for translation

    // Simulate translation: change prose, keep %%AWP..%% placeholders verbatim.
    const translated = uc.body.replace('Run', 'Запусти').replace(' for ', ' для ');
    const fin = JSON.parse(
      execFileSync('node', [CLI, 'finalize-confluence', '--source', uc.source, '--plan', planFile, '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
        input: translated,
      })
        .trim()
        .split('\n')
        .pop()!,
    ) as Envelope;
    expect((fin.data as { missing: string[] }).missing).toEqual([]);
    const finalBody = (fin.data as { body: string }).body;
    expect(finalBody).toContain('npm test'); // code restored byte-exact
    expect(finalBody).toContain('UC-014'); // id restored byte-exact
    expect(finalBody).toContain('Запусти'); // translation preserved

    // A translation that drops a placeholder → exit 2 (never publish lost protected content).
    let exitCode = 0;
    try {
      execFileSync('node', [CLI, 'finalize-confluence', '--source', uc.source, '--plan', planFile, '--cwd', root], {
        cwd: root,
        encoding: 'utf8',
        input: 'no placeholders here',
      });
    } catch (e: unknown) {
      exitCode = (e as { status: number }).status;
    }
    expect(exitCode).toBe(2);
  });
});
