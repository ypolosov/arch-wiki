import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { cac } from 'cac';
import { NodeFileSystem } from '../adapters/fs/NodeFileSystem';
import { SystemClock } from '../adapters/clock/SystemClock';
import { PluginTemplateStore } from '../adapters/template/PluginTemplateStore';
import { FilePayloadTemplateStore } from '../adapters/template/FilePayloadTemplateStore';
import { FoamWikiRepository } from '../adapters/repo/FoamWikiRepository';
import { FileVersionStore } from '../adapters/version/FileVersionStore';
import { FileProjectConfigStore } from '../adapters/config/FileProjectConfigStore';
import { FileLedgerStore } from '../adapters/ledger/FileLedgerStore';
import { GrayMatterParser } from '../adapters/frontmatter/GrayMatterParser';
import { ProjectConfig } from '../domain/services/ProjectConfig';
import { allocateNextId } from '../application/usecases/AllocateNextId';
import { scaffoldArtifact } from '../application/usecases/ScaffoldArtifact';
import { scaffoldHypothesis } from '../application/usecases/ScaffoldHypothesis';
import { scaffoldQuestionnaire, QuestionnaireMethod } from '../application/usecases/ScaffoldQuestionnaire';
import { parseQuestionnaire } from '../application/usecases/ParseQuestionnaire';
import { renderIssuePayload, IssueKind, IssueRole } from '../application/usecases/RenderIssuePayload';
import { recordIssue } from '../application/usecases/RecordIssue';
import { trace } from '../application/usecases/Trace';
import { renderStoryPullPlan } from '../application/usecases/RenderStoryPullPlan';
import { recordStorySnapshot } from '../application/usecases/RecordStorySnapshot';
import { pruneStorySnapshots } from '../application/usecases/PruneStorySnapshots';
import { renderConfluencePayload } from '../application/usecases/RenderConfluencePayload';
import { recordPage } from '../application/usecases/RecordPage';
import { applyRestore, ProtectedSpan } from '../domain/services/ConfluenceTree';
import { enrichDriver } from '../application/usecases/EnrichDriver';
import { BooksRagPlanner } from '../adapters/rag/BooksRagPlanner';
import { BooksAnswer, BooksQueryInput } from '../application/ports/BooksRagPort';
import { lintWiki } from '../application/usecases/LintWiki';
import { validateC4 } from '../application/usecases/ValidateC4';
import { C4Model } from '../domain/services/C4Consistency';
import { normalizeC4ModelJson, parseC4Sources } from '../adapters/c4/LikeC4ModelReader';
import { recordRisk } from '../application/usecases/RecordRisk';
import { updateKanban, KanbanColumn } from '../application/usecases/UpdateKanban';
import { updateUtilityTree } from '../application/usecases/UpdateUtilityTree';
import { updateGapAnalysis } from '../application/usecases/UpdateGapAnalysis';
import { reportDriverAssurance } from '../application/usecases/DriverAssurance';
import { updateEpistemicDebt } from '../application/usecases/UpdateEpistemicDebt';
import { waiveDebt } from '../application/usecases/Waive';
import { reviewAdequacy } from '../application/usecases/ReviewAdequacy';
import { syncTemplates } from '../application/usecases/SyncTemplates';
import { applyMigration } from '../application/usecases/Migrate';
import { CURRENT_SCHEMA_VERSION } from '../migrations/registry';
import { MigrationContext } from '../migrations/types';
import { resolveKind, ARTIFACT_SPECS, ArtifactKind } from '../domain/model/ArtifactType';
import { kindOfPage } from '../domain/model/WikiPage';
import { Severity } from '../domain/services/LintRuleSet';
import { isProtectedWritePath } from '../domain/services/PathUtil';
import { isNewerVersion } from '../domain/services/SemVer';
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

/**
 * Parse a CLI flag that must be a positive decimal integer. Fail-fast (exit 1, §2.4) on anything
 * else — used for `--page-version`, a Confluence page version (always ≥ 1). Strict all-digits match
 * (not `Number()`, which would silently accept `0x10`/`1e3`/`0o17` and corrupt the drift baseline,
 * review M5) + a safe-integer ceiling so the value round-trips the user's string (review L4).
 */
function positiveIntFlag(name: string, value: unknown): number {
  const s = String(value).trim();
  const n = Number(s);
  if (!/^\d+$/.test(s) || !Number.isSafeInteger(n) || n < 1) {
    throw new DomainError(`${name} must be a positive integer, got "${String(value)}"`, 1);
  }
  return n;
}

/** Read the `data.pages[]` array from a saved `render-confluence` plan file (exit 2 on malformed). */
async function readPlanPages(
  fs: NodeFileSystem,
  planArg: string,
  cwd: string,
): Promise<Array<Record<string, unknown>>> {
  const planText = await fs.readFile(path.isAbsolute(planArg) ? planArg : path.join(cwd, planArg));
  let parsed: unknown;
  try {
    parsed = JSON.parse(planText);
  } catch (e) {
    throw new DomainError(`malformed plan JSON: ${(e as Error).message}`, 2);
  }
  const env = parsed as { data?: { pages?: unknown }; pages?: unknown };
  const pages = (env.data?.pages ?? env.pages) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(pages)) throw new DomainError('plan has no data.pages[]', 2);
  return pages;
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

/**
 * Best-effort: from the running bundle's plugin dir, walk up to the harness's
 * `installed_plugins.json` and report a registered arch-wiki version newer than the one
 * we were bundled as. The PATH `arch-wiki` resolves at session start, so after `claude
 * plugin update` the old binary keeps answering until restart — this surfaces that as a
 * `version`/`doctor` warning. Environment introspection, warning-only: NEVER throws
 * (no install layout / local --plugin-dir → null, silent).
 */
async function newerInstalledVersion(fs: NodeFileSystem): Promise<string | null> {
  try {
    let dir = pluginRoot();
    for (let i = 0; i < 8; i++) {
      const candidate = path.join(dir, 'installed_plugins.json');
      if (await fs.exists(candidate)) {
        const json = JSON.parse(await fs.readFile(candidate)) as {
          plugins?: Record<string, Array<{ version?: string }> | undefined>;
        };
        for (const [key, entries] of Object.entries(json.plugins ?? {})) {
          if (!/^arch-wiki@/.test(key)) continue;
          for (const e of entries ?? []) {
            if (e?.version && isNewerVersion(e.version, PLUGIN_VERSION)) return e.version;
          }
        }
        return null;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // best-effort only — never block a command on environment introspection
  }
  return null;
}

function staleBinaryWarning(newer: string | null): string[] | undefined {
  return newer
    ? [
        `a newer arch-wiki (${newer}) is installed but this PATH binary is ${PLUGIN_VERSION} — restart the Claude Code session (the binary + MCP registry resolve at session start), or call the new version by full path`,
      ]
    : undefined;
}

function payloadsDir(): string {
  return path.join(templatesDir(), 'payloads');
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

/**
 * cwd-trap guard for commands that READ an existing wiki (NOT greenfield scaffolders): running from
 * INSIDE docs/architecture re-appends the default --root (→ docs/architecture/docs/architecture),
 * which silently reads nothing and surfaces as a confusing downstream error (e.g. "no
 * [integrations.confluence.space]"). Fail fast with an actionable hint when the wiki root is absent.
 */
async function assertWikiRootExists(opts: GlobalOpts): Promise<void> {
  const root = wikiRoot(opts);
  if (!(await new NodeFileSystem().exists(root))) {
    throw new DomainError(
      `wiki root "${root}" does not exist — run from the repo root, or pass --cwd <repo> / --root <dir>. ` +
        'If you are inside docs/architecture, cd up to the repo root (the default --root re-appends docs/architecture).',
      1,
    );
  }
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
          { repo, templates, clock: new SystemClock(), config, frontmatter: new GrayMatterParser() },
        );
        emit({ ok: true, command: 'scaffold', data: result, warnings: result.warnings });
      } catch (err) {
        fail('scaffold', err);
      }
    });

  cli
    .command('hypothesis', 'scaffold a hypothesis (concept) with traceability + a kanban card')
    .option('--title <title>', 'hypothesis title')
    .option('--slug <slug>', 'explicit kebab slug (for non-latin titles)')
    .option('--from <path>', 'originating raw/<file> back-reference (must exist)')
    .option('--driver-candidate <id>', 'forward-ref driver candidate (placeholder)')
    .option('--dry-run', 'compute and validate without writing')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.title) throw new DomainError('missing --title', 1);
        const fs = new NodeFileSystem();
        const repo = new FoamWikiRepository(wikiRoot(opts), fs);
        const templates = new PluginTemplateStore(templatesDir(), fs);
        const config = await loadProjectConfig(opts);
        const result = await scaffoldHypothesis(
          {
            title: String(opts.title),
            slug: opts.slug as string | undefined,
            from: opts.from != null ? String(opts.from) : undefined,
            driverCandidate: opts['driverCandidate'] != null ? String(opts['driverCandidate']) : undefined,
            dryRun: !!opts.dryRun,
          },
          { repo, templates, clock: new SystemClock(), config, frontmatter: new GrayMatterParser() },
        );
        emit({ ok: true, command: 'hypothesis', data: result, warnings: result.warnings });
      } catch (err) {
        fail('hypothesis', err);
      }
    });

  cli
    .command('questionnaire <method>', 'scaffold a qaw|rozanski|driver-gap questionnaire skeleton')
    .option('--topic <topic>', 'questionnaire topic')
    .option('--slug <slug>', 'explicit kebab slug (for non-latin topics)')
    .option('--related-drivers <ids>', 'comma-separated driver ids this relates to')
    .option('--dry-run', 'compute and validate without writing')
    .action(async (method: string, opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.topic) throw new DomainError('missing --topic', 1);
        const fs = new NodeFileSystem();
        const repo = new FoamWikiRepository(wikiRoot(opts), fs);
        const payloads = new FilePayloadTemplateStore(payloadsDir(), fs);
        const result = await scaffoldQuestionnaire(
          {
            method: method as QuestionnaireMethod,
            topic: String(opts.topic),
            slug: opts.slug as string | undefined,
            relatedDrivers: opts['relatedDrivers'] ? csv(opts['relatedDrivers']) : undefined,
            dryRun: !!opts.dryRun,
          },
          { repo, payloads, clock: new SystemClock(), frontmatter: new GrayMatterParser() },
        );
        emit({ ok: true, command: 'questionnaire', data: result, warnings: result.warnings });
      } catch (err) {
        fail('questionnaire', err);
      }
    });

  cli
    .command('render-issue', 'render a deterministic issue payload (IntentEnvelope) from a driver/ADR')
    .option('--from <id>', 'source artifact id (e.g. QA-007)')
    .option('--kind <kind>', 'arch|techdesign')
    .option('--role <role>', 'be|fe|do (required for techdesign)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.from) throw new DomainError('missing --from', 1);
        if (!opts.kind) throw new DomainError('missing --kind', 1);
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const payloads = new FilePayloadTemplateStore(payloadsDir(), fs);
        const result = await renderIssuePayload(
          { from: String(opts.from), kind: opts.kind as IssueKind, role: opts.role as IssueRole | undefined },
          { repo, payloads, config: await loadProjectConfig(opts), ledger: new FileLedgerStore(root, fs), hash: sha256 },
        );
        emit({ ok: true, command: 'render-issue', data: result, warnings: result.warnings });
      } catch (err) {
        fail('render-issue', err);
      }
    });

  cli
    .command('record-issue', 'record a created issue in the ledger + driver frontmatter (two-way trace)')
    .option('--id <id>', 'source artifact id (e.g. QA-007)')
    .option('--key <key>', 'external issue key (e.g. GRM-431)')
    .option('--kind <kind>', 'arch|techdesign')
    .option('--role <role>', 'be|fe|do (required for techdesign)')
    .option('--hash <hash>', 'content hash from render-issue')
    .option('--system <system>', 'external system (default jira)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.id) throw new DomainError('missing --id', 1);
        if (!opts.key) throw new DomainError('missing --key', 1);
        if (!opts.kind) throw new DomainError('missing --kind', 1);
        if (!opts.hash) throw new DomainError('missing --hash', 1);
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const result = await recordIssue(
          {
            id: String(opts.id),
            key: String(opts.key),
            kind: opts.kind as IssueKind,
            role: opts.role as IssueRole | undefined,
            hash: String(opts.hash),
            system: opts.system != null ? String(opts.system) : undefined,
          },
          { repo, ledger: new FileLedgerStore(root, fs), frontmatter: new GrayMatterParser(), clock: new SystemClock() },
        );
        emit({ ok: true, command: 'record-issue', data: result });
      } catch (err) {
        fail('record-issue', err);
      }
    });

  cli
    .command('ingest-questionnaire', 'parse an answered questionnaire into a traceability report')
    .option('--from <path>', 'raw/questionnaires/<file> to parse')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.from) throw new DomainError('missing --from', 1);
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const result = await parseQuestionnaire({ from: String(opts.from) }, { repo });
        emit({ ok: true, command: 'ingest-questionnaire', data: result });
      } catch (err) {
        fail('ingest-questionnaire', err);
      }
    });

  cli
    .command('books-plan <site>', 'render a deterministic books-rag query plan (local-rag)')
    .option('--topic <topic>', 'topic (hypothesis | questionnaire-rozanski)')
    .option('--drivers <ids>', 'comma-separated driver ids (enrich)')
    .option('--kind-hints <kinds>', 'comma-separated kind hints (hypothesis)')
    .option('--viewpoints <names>', 'comma-separated viewpoints (questionnaire-rozanski)')
    .action(async (site: string, opts: GlobalOpts & Record<string, unknown>) => {
      try {
        let input: BooksQueryInput;
        if (site === 'hypothesis') {
          if (!opts.topic) throw new DomainError('missing --topic', 1);
          input = { site, topic: String(opts.topic), kindHints: opts['kindHints'] ? csv(opts['kindHints']) : undefined };
        } else if (site === 'questionnaire-rozanski') {
          if (!opts.topic) throw new DomainError('missing --topic', 1);
          input = { site, topic: String(opts.topic), viewpoints: opts.viewpoints ? csv(opts.viewpoints) : undefined };
        } else if (site === 'enrich') {
          if (!opts.drivers) throw new DomainError('missing --drivers', 1);
          input = { site, drivers: csv(opts.drivers) };
        } else {
          throw new DomainError(`unknown books-plan site "${site}" (valid: hypothesis, questionnaire-rozanski, enrich)`, 1);
        }
        emit({ ok: true, command: 'books-plan', data: new BooksRagPlanner().renderPlan(input) });
      } catch (err) {
        fail('books-plan', err);
      }
    });

  cli
    .command('ingest', 'ingest helper: --enrich writes ## Related Patterns from books-rag answers')
    .option('--enrich', 'enrich drivers with Related Patterns')
    .option('--rag-results <json>', 'BooksAnswer[] JSON from local-rag (keyed enrich:<id>)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.enrich) throw new DomainError('ingest: only --enrich is supported as a CLI step', 1);
        if (!opts['ragResults']) throw new DomainError('ingest --enrich: missing --rag-results', 2);
        let answers: BooksAnswer[];
        try {
          const parsed = JSON.parse(String(opts['ragResults']));
          if (!Array.isArray(parsed)) throw new Error('not an array');
          answers = parsed as BooksAnswer[];
        } catch (e) {
          throw new DomainError(`ingest --enrich: malformed --rag-results: ${(e as Error).message}`, 2);
        }
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const result = await enrichDriver({ answers }, { repo });
        emit({ ok: true, command: 'ingest', data: result });
      } catch (err) {
        fail('ingest', err);
      }
    });

  cli
    .command('trace <id>', 'walk raw → driver → ADR → issue → showcase for an artifact')
    .action(async (id: string, opts: GlobalOpts) => {
      try {
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const result = await trace(id, { repo, ledger: new FileLedgerStore(root, fs) });
        emit({ ok: true, command: 'trace', data: result });
      } catch (err) {
        fail('trace', err);
      }
    });

  cli
    .command('pull-stories', 'render the deterministic plan to pull the PO User Story Log (CAP-1)')
    .option('--plan', 'emit the enumeration plan (cloudId/rootPageId/alreadyPulled) — default')
    .action(async (opts: GlobalOpts) => {
      try {
        const fs = new NodeFileSystem();
        const plan = await renderStoryPullPlan({
          config: await loadProjectConfig(opts),
          ledger: new FileLedgerStore(wikiRoot(opts), fs),
        });
        emit({ ok: true, command: 'pull-stories', data: plan });
      } catch (err) {
        fail('pull-stories', err);
      }
    });

  cli
    .command('record-story', 'write a READ-ONLY User Story snapshot into raw/_synced (body via stdin)')
    .option('--page <id>', 'upstream Confluence page id')
    .option('--title <title>', 'story title')
    .option('--page-version <n>', 'upstream Confluence page version (cac reserves --version)')
    .option('--parent <id>', 'parent page id')
    .option('--slug <slug>', 'explicit kebab slug (for non-latin titles)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.page) throw new DomainError('missing --page', 1);
        if (!opts.title) throw new DomainError('missing --title', 1);
        const body = await readStdin();
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const result = await recordStorySnapshot(
          {
            pageId: String(opts.page),
            title: String(opts.title),
            version: opts.pageVersion != null ? positiveIntFlag('--page-version', opts.pageVersion) : 0,
            body,
            parentId: opts.parent != null ? String(opts.parent) : undefined,
            slug: opts.slug as string | undefined,
          },
          {
            repo: new FoamWikiRepository(root, fs),
            ledger: new FileLedgerStore(root, fs),
            clock: new SystemClock(),
            hash: sha256,
            frontmatter: new GrayMatterParser(),
          },
        );
        emit({ ok: true, command: 'record-story', data: result });
      } catch (err) {
        fail('record-story', err);
      }
    });

  cli
    .command('prune-stories', 'orphan-reconcile pulled snapshots against the live upstream page-id set')
    .option('--live <ids>', 'comma-separated upstream page-ids still present (empty = prune all)')
    .option('--commit', 'delete the orphan snapshots + ledger rows (default: plan only — deletes nothing)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (opts.live == null) {
          throw new DomainError('prune-stories: missing --live (pass empty only to prune all)', 1);
        }
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const result = await pruneStorySnapshots(
          csv(opts.live),
          {
            repo: new FoamWikiRepository(root, fs),
            ledger: new FileLedgerStore(root, fs),
          },
          { commit: !!opts.commit },
        );
        emit({ ok: true, command: 'prune-stories', data: result });
      } catch (err) {
        fail('prune-stories', err);
      }
    });

  cli
    .command('render-confluence', 'render the full Confluence KB-mirror plan (CAP-2; MCP-free)')
    .option('--all', 'mirror the whole wiki (default)')
    .option('--page <path>', 'restrict the emitted plan to a single wiki source path (testing/incremental)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        await assertWikiRootExists(opts); // clear cwd-trap error instead of a confusing "no space"
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const plan = await renderConfluencePayload({
          repo: new FoamWikiRepository(root, fs),
          ledger: new FileLedgerStore(root, fs),
          config: await loadProjectConfig(opts),
          hash: sha256,
        });
        let data = plan;
        if (opts.page) {
          const bySource = new Map(plan.pages.map((p) => [p.source, p]));
          const target = bySource.get(String(opts.page));
          if (!target) {
            // fail-fast §2.4 (consistent with record-page / finalize-confluence): a typo or an
            // excluded page must not look like a successful empty publish.
            throw new DomainError(
              `render-confluence --page: no mirror page with source "${opts.page}" — check the path, ` +
                'or it may be excluded by the visibility filter (confluence:false / audience:internal / ' +
                'proposed|rejected ADR / register page)',
              2,
            );
          }
          // C-2: emit the target PLUS its full ancestor chain so the orchestrator creates parents
          // before the target — a partial publish keeps the mirror hierarchy instead of going flat.
          const chain = new Set<string>();
          let cur: string | null = target.source;
          while (cur != null && !chain.has(cur)) {
            chain.add(cur);
            cur = bySource.get(cur)?.parentSource ?? null;
          }
          // plan.pages is already parent-first (sortParentFirst) — preserve that order.
          data = { ...plan, pages: plan.pages.filter((p) => chain.has(p.source)) };
        }
        emit({ ok: true, command: 'render-confluence', data });
      } catch (err) {
        fail('render-confluence', err);
      }
    });

  cli
    .command('record-page', 'record a published Confluence page in the ledger + published_as frontmatter')
    .option('--source <path>', 'wiki-relative source path (the ledger key)')
    .option('--page <id>', 'external Confluence page id')
    .option('--hash <hash>', 'content hash from render-confluence')
    .option('--page-version <n>', 'Confluence page version returned by create/update (destination-drift baseline)')
    .option('--from-plan <file>', 'read --hash (+ --page if absent) for --source from a saved render-confluence plan (avoids a stale hand-copied hash; pass-2 resolves cross-links → the hash changes)')
    .option('--system <system>', 'external system (default confluence)')
    .option('--delete', 'reconcile a deleted orphan: drop the ledger row + published_as')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.source) throw new DomainError('missing --source', 1);
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        let hash = opts.hash != null ? String(opts.hash) : undefined;
        let page = opts.page != null ? String(opts.page) : undefined;
        if (opts['fromPlan']) {
          const pages = await readPlanPages(fs, String(opts['fromPlan']), opts.cwd ?? process.cwd());
          const p = pages.find((x) => x.source === String(opts.source));
          if (!p) {
            throw new DomainError(`record-page: no page with source "${opts.source}" in the plan`, 2);
          }
          if (p.contentHash != null) hash = String(p.contentHash); // authoritative: the plan's current hash
          if (page == null && p.pageId != null) page = String(p.pageId);
        }
        const result = await recordPage(
          {
            source: String(opts.source),
            page,
            hash,
            pageVersion: opts.pageVersion != null ? positiveIntFlag('--page-version', opts.pageVersion) : undefined,
            system: opts.system != null ? String(opts.system) : undefined,
            del: !!opts['delete'],
          },
          {
            repo: new FoamWikiRepository(root, fs),
            ledger: new FileLedgerStore(root, fs),
            frontmatter: new GrayMatterParser(),
            clock: new SystemClock(),
          },
        );
        emit({ ok: true, command: 'record-page', data: result });
      } catch (err) {
        fail('record-page', err);
      }
    });

  cli
    .command('finalize-confluence', 'restore protected spans into a TRANSLATED Confluence page body (CAP-2 RU)')
    .option('--source <path>', 'wiki source path of the page (key into the render-confluence plan)')
    .option('--plan <file>', 'the saved `render-confluence --all` plan JSON (carries each page restore map)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.source) throw new DomainError('finalize-confluence: missing --source', 1);
        if (!opts.plan) throw new DomainError('finalize-confluence: missing --plan', 1);
        const fs = new NodeFileSystem();
        const planArg = String(opts.plan);
        const planText = await fs.readFile(
          path.isAbsolute(planArg) ? planArg : path.join(opts.cwd ?? process.cwd(), planArg),
        );
        let parsed: unknown;
        try {
          parsed = JSON.parse(planText);
        } catch (e) {
          throw new DomainError(`finalize-confluence: malformed plan JSON: ${(e as Error).message}`, 2);
        }
        const env = parsed as { data?: { pages?: unknown }; pages?: unknown };
        const pages = (env.data?.pages ?? env.pages) as
          | Array<{ source: string; restore?: ProtectedSpan[] }>
          | undefined;
        if (!Array.isArray(pages)) throw new DomainError('finalize-confluence: plan has no data.pages[]', 2);
        const page = pages.find((p) => p.source === String(opts.source));
        if (!page) {
          throw new DomainError(`finalize-confluence: no page with source "${opts.source}" in the plan`, 2);
        }
        const translated = await readStdin();
        const { body, missing } = applyRestore(translated, page.restore ?? []);
        emit({ ok: missing.length === 0, command: 'finalize-confluence', data: { body, missing } });
        if (missing.length > 0) process.exit(2);
      } catch (err) {
        fail('finalize-confluence', err);
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
        warnings: staleBinaryWarning(await newerInstalledVersion(fs)),
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
    .command('validate-c4', 'check C4 model ⟷ wiki entity consistency (deterministic, MCP-free)')
    .option('--stdin', 'read the normalized C4 model JSON from stdin (LikeC4 MCP / likec4 export json)')
    .option('--model-json <file>', 'read the normalized C4 model JSON from a file')
    .option('--source <mode>', 'json|regex (default json; regex reads c4().dir *.c4 — lossy fallback)')
    .option('--establish-baseline', 'record current mismatches as the known baseline (no findings emitted)')
    .option('--severity <level>', 'minimum severity: low|medium|high')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const config = await loadProjectConfig(opts);
        const policy = config.c4Consistency();
        const source = opts.source != null ? String(opts.source) : 'json';

        let model: C4Model;
        if (source === 'regex') {
          // Lossy last-resort: read *.c4 under the configured c4 dir.
          let c4SourceDir: string;
          try {
            c4SourceDir = config.c4().dir;
          } catch {
            throw new DomainError(
              'validate-c4 --source regex needs a [c4] config (e.g. {"c4":{"dir":"c4/src"}} in ' +
                '.arch-wiki/config.json); or use --stdin / --model-json (LikeC4 MCP / `likec4 export ' +
                'json`), which need no [c4] config',
              2,
            );
          }
          const c4dir = path.join(root, c4SourceDir);
          const files = (await fs.exists(c4dir)) ? (await fs.walk(c4dir)).filter((f) => f.endsWith('.c4')) : [];
          const text = (await Promise.all(files.map((f) => fs.readFile(f)))).join('\n');
          model = parseC4Sources(text);
        } else if (source === 'json') {
          let text: string;
          if (opts.stdin) {
            text = await readStdin();
          } else if (opts['modelJson']) {
            const arg = String(opts['modelJson']);
            text = await fs.readFile(path.isAbsolute(arg) ? arg : path.join(opts.cwd ?? process.cwd(), arg));
          } else {
            throw new DomainError('validate-c4: provide --stdin or --model-json <file> (or --source regex)', 1);
          }
          let raw: unknown;
          try {
            raw = JSON.parse(text);
          } catch (e) {
            throw new DomainError(`validate-c4: malformed model JSON: ${(e as Error).message}`, 2);
          }
          model = normalizeC4ModelJson(raw);
        } else {
          throw new DomainError(`validate-c4: unknown --source "${source}" (valid: json, regex)`, 1);
        }

        const report = await validateC4(model, repo, {
          policy,
          establishBaseline: !!opts['establishBaseline'],
          severity: opts.severity as Severity | undefined,
        });
        emit({ ok: report.findings.length === 0, command: 'validate-c4', data: report });
        if (!opts['establishBaseline'] && report.findings.length > 0) process.exit(2);
      } catch (err) {
        fail('validate-c4', err);
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
    .command('update-kanban', 'idempotently add/move a card in kanban.md (intent source-of-truth)')
    .option('--add <id>', 'card id/basename to add (rendered as a wikilink)')
    .option('--column <col>', 'backlog|in-progress|done (default backlog on a new card)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.add) throw new DomainError('missing --add', 1);
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const result = await updateKanban(
          { add: String(opts.add), column: opts.column as KanbanColumn | undefined },
          { repo },
        );
        emit({ ok: true, command: 'update-kanban', data: result });
      } catch (err) {
        fail('update-kanban', err);
      }
    });

  cli
    .command('update-utility-tree', 'idempotently upsert a QAW row into utility-tree.md')
    .option('--from <id>', 'quality-attribute driver id (keyed; placeholder if absent)')
    .option('--scenario <text>', 'quality scenario one-liner')
    .option('--priority <text>', 'priority marker (e.g. H/M/L)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        if (!opts.from) throw new DomainError('missing --from', 1);
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const result = await updateUtilityTree(
          {
            from: String(opts.from),
            scenario: opts.scenario != null ? String(opts.scenario) : undefined,
            priority: opts.priority != null ? String(opts.priority) : undefined,
          },
          { repo },
        );
        emit({ ok: true, command: 'update-utility-tree', data: result });
      } catch (err) {
        fail('update-utility-tree', err);
      }
    });

  cli
    .command('update-gap-analysis', 'regenerate the open-gaps region of gap-analysis.md from lint')
    .action(async (opts: GlobalOpts) => {
      try {
        const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
        const report = await lintWiki(repo, { config: await loadProjectConfig(opts) });
        const gaps = report.findings
          .filter((f) => f.rule === 'uncovered-driver' && f.file)
          .map((f) => ({ driver: f.file!.replace(/^.*\//, '').replace(/\.md$/, ''), reason: f.message }));
        const result = await updateGapAnalysis({ gaps }, { repo });
        emit({ ok: true, command: 'update-gap-analysis', data: result });
      } catch (err) {
        fail('update-gap-analysis', err);
      }
    });

  cli
    .command('assurance', 'compute AssuranceLevel L0/L1/L2 per driver (FPF B.3.3, deterministic)')
    .action(async (opts: GlobalOpts) => {
      try {
        await assertWikiRootExists(opts);
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const report = await reportDriverAssurance({ repo, ledger: new FileLedgerStore(root, fs) });
        emit({ ok: true, command: 'assurance', data: report });
      } catch (err) {
        fail('assurance', err);
      }
    });

  cli
    .command('update-epistemic-debt', 'regenerate the epistemic-debt.md decay register (FPF B.3.4)')
    .action(async (opts: GlobalOpts) => {
      try {
        await assertWikiRootExists(opts);
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const result = await updateEpistemicDebt({
          repo,
          ledger: new FileLedgerStore(root, fs),
          clock: new SystemClock(),
          budgetDays: (await loadProjectConfig(opts)).debtBudgetDays(),
        });
        emit({ ok: true, command: 'update-epistemic-debt', data: result });
      } catch (err) {
        fail('update-epistemic-debt', err);
      }
    });

  cli
    .command('waive-debt', 'record a human-gated epistemic-debt waiver for a subject (FPF B.3.4 CC-ED.5)')
    .option('--subject <id>', 'artifact basename whose debt is waived')
    .option('--reason <text>', 'why the debt is accepted for now')
    .option('--until <date>', 'ISO date the waiver expires (omit for indefinite)')
    .option('--by <who>', 'who authorized the waiver (audit)')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        await assertWikiRootExists(opts);
        const fs = new NodeFileSystem();
        const result = await waiveDebt(
          {
            subject: opts.subject ? String(opts.subject) : '',
            reason: opts.reason ? String(opts.reason) : '',
            until: opts.until ? String(opts.until) : null,
            by: opts.by ? String(opts.by) : '',
          },
          { ledger: new FileLedgerStore(wikiRoot(opts), fs), clock: new SystemClock() },
        );
        emit({ ok: true, command: 'waive-debt', data: result });
      } catch (err) {
        fail('waive-debt', err);
      }
    });

  cli
    .command('adequacy', 'score per-kind structural adequacy of design artifacts (FPF C.32.ADA, deterministic)')
    .option('--kind <kind>', 'restrict to one kind (adr|use-case|quality-attribute|constraint|concern|iteration|concept|entity)')
    .option('--id <id>', 'restrict to one artifact by id/basename')
    .action(async (opts: GlobalOpts & Record<string, unknown>) => {
      try {
        await assertWikiRootExists(opts);
        const fs = new NodeFileSystem();
        const root = wikiRoot(opts);
        const repo = new FoamWikiRepository(root, fs);
        const report = await reviewAdequacy(
          {
            kind: opts.kind ? (String(opts.kind) as ArtifactKind) : undefined,
            id: opts.id ? String(opts.id) : undefined,
          },
          { repo, ledger: new FileLedgerStore(root, fs) },
        );
        emit({ ok: true, command: 'adequacy', data: report });
      } catch (err) {
        fail('adequacy', err);
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
      emit({
        ok: true,
        command: 'version',
        data,
        warnings: staleBinaryWarning(await newerInstalledVersion(new NodeFileSystem())),
      });
    });

  cli.help();
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
}

main().catch((err) => fail('arch-wiki', err));
