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
});
