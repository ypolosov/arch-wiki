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
