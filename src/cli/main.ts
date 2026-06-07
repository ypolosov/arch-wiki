import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { cac } from 'cac';
import { NodeFileSystem } from '../adapters/fs/NodeFileSystem';
import { SystemClock } from '../adapters/clock/SystemClock';
import { PluginTemplateStore } from '../adapters/template/PluginTemplateStore';
import { FoamWikiRepository } from '../adapters/repo/FoamWikiRepository';
import { FileVersionStore } from '../adapters/version/FileVersionStore';
import { FileProjectConfigStore } from '../adapters/config/FileProjectConfigStore';
import { ProjectConfig } from '../domain/services/ProjectConfig';
import { allocateNextId } from '../application/usecases/AllocateNextId';
import { scaffoldArtifact } from '../application/usecases/ScaffoldArtifact';
import { lintWiki } from '../application/usecases/LintWiki';
import { recordRisk } from '../application/usecases/RecordRisk';
import { syncTemplates } from '../application/usecases/SyncTemplates';
import { applyMigration } from '../application/usecases/Migrate';
import { CURRENT_SCHEMA_VERSION } from '../migrations/registry';
import { MigrationContext } from '../migrations/types';
import { resolveKind, ARTIFACT_SPECS, ArtifactKind } from '../domain/model/ArtifactType';
import { kindOfPage } from '../domain/model/WikiPage';
import { Severity } from '../domain/services/LintRuleSet';
import { isProtectedWritePath } from '../domain/services/PathUtil';
import { DomainError } from '../domain/errors';
import { PLUGIN_VERSION } from './version';

const WIKI_MARKER = 'docs/architecture/';

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

function hookFilePath(stdinJson: string): string {
  try {
    return (JSON.parse(stdinJson)?.tool_input?.file_path as string) ?? '';
  } catch {
    return '';
  }
}

function migrationContext(opts: GlobalOpts): MigrationContext {
  const root = wikiRoot(opts);
  const fs = new NodeFileSystem();
  const repo = new FoamWikiRepository(root, fs);
  const clock = new SystemClock();
  return {
    abs: (relPath: string) => path.join(root, relPath),
    fs,
    // Baseline must be computed with the SAME required-sections the runtime lint
    // uses, or suppression keys won't match (plan §3.7 fix #8).
    lint: async () => (await lintWiki(repo, { config: await loadProjectConfig(opts) })).findings,
    hash: (content: string) => createHash('sha256').update(content).digest('hex'),
    now: () => clock.now(),
  };
}

function csv(value: unknown): string[] {
  return value
    ? String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

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

/** Composition: load the target's project profile (throws exit 2 if malformed/invalid). */
async function loadProjectConfig(opts: GlobalOpts): Promise<ProjectConfig> {
  const store = new FileProjectConfigStore(wikiRoot(opts), new NodeFileSystem());
  return ProjectConfig.from(await store.read());
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
        const config = await loadProjectConfig(opts);
        const result = await scaffoldArtifact(
          { spec, title: String(opts.title), slug: opts.slug as string | undefined, drivers, dryRun: !!opts.dryRun },
          { repo, templates, clock: new SystemClock(), config },
        );
        emit({ ok: true, command: 'scaffold', data: result, warnings: result.warnings });
      } catch (err) {
        fail('scaffold', err);
      }
    });

  cli
    .command('guard-path', 'PreToolUse hook: block writes to raw/ and .likec4 snapshots')
    .option('--stdin', 'read the hook payload from stdin')
    .action(async () => {
      try {
        const fp = hookFilePath(await readStdin());
        if (fp && isProtectedWritePath(fp)) {
          process.stderr.write(`arch-wiki: blocked write to immutable path: ${fp}\n`);
          process.exit(2);
        }
      } catch {
        // never hard-fail an edit because the guard misbehaved
      }
      process.exit(0);
    });

  cli
    .command('hook-lint-changed', 'PostToolUse hook: lint the changed wiki file (high only)')
    .option('--stdin', 'read the hook payload from stdin')
    .action(async () => {
      try {
        const fp = hookFilePath(await readStdin()).split('\\').join('/');
        const idx = fp.indexOf(WIKI_MARKER);
        if (idx < 0 || !fp.endsWith('.md')) process.exit(0);
        const root = fp.slice(0, idx + WIKI_MARKER.length - 1); // .../docs/architecture
        const rel = fp.slice(idx + WIKI_MARKER.length);
        const fs = new NodeFileSystem();
        const repo = new FoamWikiRepository(root, fs);
        // Cheap: one small JSON read; lets required-section (high) findings fire on edit.
        const config = ProjectConfig.from(await new FileProjectConfigStore(root, fs).read());
        const report = await lintWiki(repo, { changed: [rel], severity: 'high', config });
        if (report.findings.length > 0) {
          process.stdout.write(`${JSON.stringify({ ok: false, command: 'hook-lint-changed', data: report })}\n`);
          process.exit(2);
        }
      } catch {
        // non-blocking: a hook failure must not wedge editing
      }
      process.exit(0);
    });

  cli.command('doctor', 'environment preflight').action(async (opts: GlobalOpts) => {
    try {
      const fs = new NodeFileSystem();
      const tdir = templatesDir();
      let config: { present: boolean; valid: boolean; error?: string };
      try {
        const file = await new FileProjectConfigStore(wikiRoot(opts), fs).read();
        config = { present: file !== null, valid: true };
      } catch (e) {
        config = { present: true, valid: false, error: e instanceof Error ? e.message : String(e) };
      }
      emit({
        ok: config.valid,
        command: 'doctor',
        data: {
          node: process.version,
          pluginVersion: PLUGIN_VERSION,
          pluginRoot: pluginRoot(),
          templatesDir: tdir,
          templatesPresent: await fs.exists(tdir),
          config,
        },
      });
    } catch (err) {
      fail('doctor', err);
    }
  });

  cli
    .command('config', 'load + validate the project profile (.arch-wiki/config.json)')
    .option('--check', 'validate only (default); exit 2 on invalid')
    .option('--show', 'show per-kind effective resolution (override vs default)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const store = new FileProjectConfigStore(wikiRoot(opts), new NodeFileSystem());
        const file = await store.read(); // throws exit 2 on malformed/invalid
        const cfg = ProjectConfig.from(file);
        if (opts.show) {
          const resolved = (Object.keys(ARTIFACT_SPECS) as ArtifactKind[]).map((kind) => ({
            kind,
            hubFile: cfg.hubFile(kind),
            requiredSections: cfg.requiredSections(kind),
          }));
          emit({
            ok: true,
            command: 'config',
            data: { present: file !== null, resolved, notifications: cfg.notificationTarget() },
          });
        } else {
          emit({ ok: true, command: 'config', data: { present: file !== null, valid: true, profile: file } });
        }
      } catch (err) {
        fail('config', err);
      }
    });

  cli
    .command('lint', 'audit graph integrity with deterministic rules')
    .option('--json', 'emit JSON (always on; accepted for compatibility)')
    .option('--changed <files>', 'comma-separated wiki-relative paths to scope to')
    .option('--severity <level>', 'minimum severity: low|medium|high')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const report = await lintWiki(repo, {
          changed: opts.changed ? csv(opts.changed) : undefined,
          severity: opts.severity as Severity | undefined,
          config: await loadProjectConfig(opts),
        });
        emit({ ok: report.findings.length === 0, command: 'lint', data: report });
        if (report.findings.length > 0) process.exit(2);
      } catch (err) {
        fail('lint', err);
      }
    });

  cli
    .command('validate-graph', 'check links, orphans, coverage (broken links block)')
    .action(async (opts: GlobalOpts) => {
      try {
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const report = await lintWiki(repo, { config: await loadProjectConfig(opts) });
        const broken = report.findings.filter((f) => f.rule.startsWith('broken'));
        emit({
          ok: broken.length === 0,
          command: 'validate-graph',
          data: { findings: report.findings, counts: report.counts, brokenCount: broken.length },
        });
        if (broken.length > 0) process.exit(2);
      } catch (err) {
        fail('validate-graph', err);
      }
    });

  cli
    .command('list <type>', 'list existing artifacts of a type')
    .action(async (type: string, opts: GlobalOpts) => {
      try {
        const spec = resolveKind(type);
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const pages = await repo.loadPages();
        const items = pages
          .filter((p) => kindOfPage(p) === spec.kind)
          .map((p) => ({ basename: p.basename, path: p.relPath }))
          .sort((a, b) => a.basename.localeCompare(b.basename));
        emit({ ok: true, command: 'list', data: { kind: spec.kind, items } });
      } catch (err) {
        fail('list', err);
      }
    });

  cli
    .command('record-risk', 'idempotently record a risk/contradiction row in risks.md')
    .option('--source <name>', 'where it was detected (e.g. ingest, lint)')
    .option('--id <id>', 'related artifact id (e.g. QA-007)')
    .option('--conflict <text>', 'one-line description of the risk/contradiction')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.source) throw new DomainError('missing --source', 1);
        if (!opts.conflict) throw new DomainError('missing --conflict', 1);
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const date = new SystemClock().now().toISOString().slice(0, 10);
        const result = await recordRisk(
          {
            source: String(opts.source),
            id: opts.id != null ? String(opts.id) : undefined,
            conflict: String(opts.conflict),
            date,
          },
          { repo, hash: sha256 },
        );
        emit({ ok: true, command: 'record-risk', data: result });
      } catch (err) {
        fail('record-risk', err);
      }
    });

  cli
    .command('sync-templates', 'sync plugin templates into target .foam/templates (non-destructive)')
    .option('--check', 'report drift only (default; exits 2 on missing/stale)')
    .option('--force', 'create missing and update stale templates (curated files preserved)')
    .option('--dry-run', 'preview without writing or failing')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const fs = new NodeFileSystem();
        const repo = new FoamWikiRepository(wikiRoot(opts), fs);
        const templates = new PluginTemplateStore(templatesDir(), fs);
        const write = !!opts.force;
        const result = await syncTemplates({ write }, { templates, repo, hash: sha256 });
        const warnings =
          result.counts.curated > 0
            ? [`${result.counts.curated} curated template(s) preserved (not arch-wiki-managed)`]
            : undefined;
        // Drift is reported, not an error: ok stays true. The non-zero exit (in
        // gate mode) is the CI signal; data.drift distinguishes "drift found".
        emit({ ok: true, command: 'sync-templates', data: result, warnings });
        if (!write && !opts.dryRun && result.actionable > 0) process.exit(2);
      } catch (err) {
        fail('sync-templates', err);
      }
    });

  cli
    .command('migrate', 'apply schema migrations sequentially to the target wiki')
    .option('--to <n>', 'target schema version (default: current)')
    .option('--status', 'report current/target/pending without applying')
    .option('--dry-run', 'plan without writing')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const store = new FileVersionStore(wikiRoot(opts), new NodeFileSystem());
        const to = opts.to != null ? Number(opts.to) : undefined;
        const result = await applyMigration(store, migrationContext(opts), {
          to,
          dryRun: !!opts.dryRun || !!opts.status,
          pluginVersion: PLUGIN_VERSION,
        });
        emit({ ok: true, command: 'migrate', data: result });
      } catch (err) {
        fail('migrate', err);
      }
    });

  cli
    .command('adopt', 'onboard an existing (populated) wiki onto the contract — first-time')
    .option('--dry-run', 'plan without writing')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const store = new FileVersionStore(wikiRoot(opts), new NodeFileSystem());
        const existing = await store.read();
        if (existing && !opts.dryRun) {
          throw new DomainError(
            `already adopted (schema v${existing.schemaVersion}); use 'migrate' instead`,
            1,
          );
        }
        const result = await applyMigration(store, migrationContext(opts), {
          dryRun: !!opts.dryRun,
          pluginVersion: PLUGIN_VERSION,
        });
        emit({ ok: true, command: 'adopt', data: result });
      } catch (err) {
        fail('adopt', err);
      }
    });

  cli
    .command('version', 'print plugin/schema versions')
    .option('--target', 'include the target wiki schema version')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      const data: Record<string, unknown> = {
        plugin: PLUGIN_VERSION,
        schema: CURRENT_SCHEMA_VERSION,
        node: process.version,
      };
      if (opts.target) {
        const marker = await new FileVersionStore(wikiRoot(opts), new NodeFileSystem()).read();
        data.targetSchema = marker?.schemaVersion ?? null;
        data.migrationNeeded = (marker?.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION;
      }
      emit({ ok: true, command: 'version', data });
    });

  cli.help();
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
}

main().catch((err) => fail('arch-wiki', err));
