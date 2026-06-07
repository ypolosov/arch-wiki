import * as path from 'node:path';
import { cac } from 'cac';
import { NodeFileSystem } from '../adapters/fs/NodeFileSystem';
import { SystemClock } from '../adapters/clock/SystemClock';
import { PluginTemplateStore } from '../adapters/template/PluginTemplateStore';
import { FoamWikiRepository } from '../adapters/repo/FoamWikiRepository';
import { allocateNextId } from '../application/usecases/AllocateNextId';
import { scaffoldArtifact } from '../application/usecases/ScaffoldArtifact';
import { resolveKind } from '../domain/model/ArtifactType';
import { DomainError } from '../domain/errors';
import { PLUGIN_VERSION } from './version';

interface GlobalOpts {
  cwd?: string;
  root?: string;
}

interface Envelope {
  ok: boolean;
  command: string;
  data?: unknown;
  warnings?: string[];
  errors?: string[];
}

function pluginRoot(): string {
  // Bundled at dist/cli.cjs → plugin root is one level up.
  return process.env.ARCH_WIKI_PLUGIN_ROOT ?? path.resolve(__dirname, '..');
}

function templatesDir(): string {
  return process.env.ARCH_WIKI_TEMPLATES_DIR ?? path.join(pluginRoot(), 'templates');
}

function wikiRoot(opts: GlobalOpts): string {
  const cwd = opts.cwd ?? process.cwd();
  const root = opts.root ?? 'docs/architecture';
  return path.isAbsolute(root) ? root : path.join(cwd, root);
}

function emit(env: Envelope): void {
  process.stdout.write(`${JSON.stringify(env)}\n`);
}

function fail(command: string, err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const code = err instanceof DomainError ? err.exitCode : 3;
  process.stderr.write(`${JSON.stringify({ ok: false, command, errors: [message] })}\n`);
  process.exit(code);
}

async function main(): Promise<void> {
  const cli = cac('arch-wiki');
  cli.option('--cwd <dir>', 'target repo root (default: process.cwd())');
  cli.option('--root <dir>', 'wiki root relative to cwd', { default: 'docs/architecture' });

  cli
    .command('next-id <type>', 'allocate the next id for an artifact type')
    .action(async (type: string, opts: GlobalOpts) => {
      try {
        const spec = resolveKind(type);
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const id = await allocateNextId(spec, repo);
        emit({ ok: true, command: 'next-id', data: { id: id.toString() } });
      } catch (err) {
        fail('next-id', err);
      }
    });

  cli
    .command('scaffold <type>', 'scaffold a new artifact from its template')
    .option('--title <title>', 'artifact title')
    .option('--slug <slug>', 'explicit kebab slug (for non-latin titles)')
    .option('--drivers <ids>', 'comma-separated driver ids to wire')
    .option('--dry-run', 'compute and validate without writing')
    .action(async (type: string, opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const spec = resolveKind(type);
        if (!opts.title) throw new DomainError('missing --title', 1);
        const fs = new NodeFileSystem();
        const repo = new FoamWikiRepository(wikiRoot(opts), fs);
        const templates = new PluginTemplateStore(templatesDir(), fs);
        const drivers = opts.drivers
          ? String(opts.drivers)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        const result = await scaffoldArtifact(
          { spec, title: String(opts.title), slug: opts.slug as string | undefined, drivers, dryRun: !!opts.dryRun },
          { repo, templates, clock: new SystemClock() },
        );
        emit({ ok: true, command: 'scaffold', data: result, warnings: result.warnings });
      } catch (err) {
        fail('scaffold', err);
      }
    });

  cli.command('doctor', 'environment preflight').action(async () => {
    try {
      const fs = new NodeFileSystem();
      const tdir = templatesDir();
      emit({
        ok: true,
        command: 'doctor',
        data: {
          node: process.version,
          pluginVersion: PLUGIN_VERSION,
          pluginRoot: pluginRoot(),
          templatesDir: tdir,
          templatesPresent: await fs.exists(tdir),
        },
      });
    } catch (err) {
      fail('doctor', err);
    }
  });

  cli.command('version', 'print plugin and node versions').action(() => {
    emit({ ok: true, command: 'version', data: { plugin: PLUGIN_VERSION, node: process.version } });
  });

  cli.help();
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
}

main().catch((err) => fail('arch-wiki', err));
