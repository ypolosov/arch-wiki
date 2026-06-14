import { DomainError } from '../../domain/errors';
import { render } from '../../domain/services/TemplateEngine';
import { buildGraph, GraphSnapshot } from '../../domain/model/Graph';
import { WikiPage } from '../../domain/model/WikiPage';
import { confluencePageUrl } from '../../domain/services/ConfluenceTree';
import { PayloadTemplatePort } from '../ports/PayloadTemplatePort';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { ProjectConfig } from '../../domain/services/ProjectConfig';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export type IssueKind = 'arch' | 'techdesign';
export type IssueRole = 'be' | 'fe' | 'do';
export const ISSUE_KINDS: readonly IssueKind[] = ['arch', 'techdesign'];
export const ISSUE_ROLES: readonly IssueRole[] = ['be', 'fe', 'do'];

export interface RenderIssueInput {
  /** Source artifact id (e.g. QA-007). */
  from: string;
  kind: IssueKind;
  /** Required when kind === techdesign. */
  role?: IssueRole;
}

export interface RenderIssueDeps {
  repo: WikiRepositoryPort;
  payloads: PayloadTemplatePort;
  config: ProjectConfig;
  ledger: LedgerStorePort;
  hash: (content: string) => string;
}

/** A human-navigable link from the issue to the Confluence MIRROR page of an artifact. */
export interface TraceLink {
  /** Artifact id (e.g. QA-007 / ADR-0001), or null if the heading has none. */
  id: string | null;
  title: string;
  /** Absolute (when confluence.siteUrl set) or root-relative `/wiki/…` page URL. */
  url: string;
}

export interface IntentEnvelope {
  kind: IssueKind;
  role: string | null;
  prefix: string;
  language: string;
  title: string;
  issueTitle: string;
  sourceId: string;
  drivers: string[];
  /**
   * Confluence-mirror links for the source artifact + the artifacts it references —
   * for the issue's `## Источник` trace section. Presentation only (NOT in contentHash,
   * so publishing/refreshing the mirror never drifts an already-created issue). Empty
   * when Confluence is unconfigured or the targets are not yet mirrored.
   */
  traceLinks: TraceLink[];
  contentHash: string;
  payload: string;
  /** Idempotency: an issue for (sourceId, kind, role) already exists in the ledger. */
  alreadyCreated: boolean;
  /** alreadyCreated && the payload hash differs from the ledgered one. */
  drifted: boolean;
  /** Existing ledger key when alreadyCreated, else null. */
  key: string | null;
  warnings: string[];
}

/** Strip a leading `ID: ` from a heading to get a clean title. */
function cleanTitle(heading: string): string {
  return heading.replace(/^\s*[A-Za-z]+-\d+\S*:\s*/, '').trim();
}

/** Extract the artifact id from a heading (`ADR-0001: …` → `ADR-0001`), else null. */
function idOf(heading: string | undefined): string | null {
  if (!heading) return null;
  const m = /^\s*([A-Za-z]+-\d+\S*?):/.exec(heading);
  return m ? m[1]! : null;
}

/**
 * Resolve the issue's Confluence trace links: the source artifact's own mirror page plus
 * each artifact it references (`## Related` wikilinks) that is already mirrored. Authority
 * is the published-pages ledger (invariant 7); an unpublished target yields no link (the
 * caller warns to publish first). Deterministic: insertion order is source-first, then the
 * source's wikilinks in document order; deduped by url. Pure.
 */
function resolveTraceLinks(args: {
  from: string;
  title: string;
  sourcePage: WikiPage | null;
  graph: GraphSnapshot;
  publishedMap: ReadonlyMap<string, string>;
  space: string | null;
  siteUrl: string | null;
}): { traceLinks: TraceLink[]; warnings: string[] } {
  const { from, title, sourcePage, graph, publishedMap, space, siteUrl } = args;
  if (!space || !sourcePage) return { traceLinks: [], warnings: [] };
  const warnings: string[] = [];
  const byUrl = new Map<string, TraceLink>();
  const add = (relPath: string, id: string | null, ttl: string): boolean => {
    const pid = publishedMap.get(relPath);
    if (!pid) return false;
    const url = confluencePageUrl(siteUrl, space, pid);
    if (!byUrl.has(url)) byUrl.set(url, { id, title: ttl, url });
    return true;
  };
  if (!add(sourcePage.relPath, from, title)) {
    warnings.push(`source ${from} is not yet mirrored to Confluence (no trace link); run /arch-wiki:publish first`);
  }
  for (const l of sourcePage.links) {
    const tp = graph.byBasename.get(l.target);
    if (tp && tp.relPath !== sourcePage.relPath) {
      add(tp.relPath, idOf(tp.headings[0]), cleanTitle(tp.headings[0] ?? tp.basename));
    }
  }
  const traceLinks = [...byUrl.values()];
  if (siteUrl == null && traceLinks.length > 0) {
    warnings.push(
      'integrations.confluence.siteUrl not set — trace links are root-relative (resolve from Jira on the same Atlassian site; set siteUrl for absolute links)',
    );
  }
  return { traceLinks, warnings };
}

/**
 * Deterministically render an issue payload (IntentEnvelope) from a source driver/ADR.
 * Core renders; the LLM maps to MCP and performs the side-effect (invariant 6, no
 * perform() here). Idempotency keys on the STABLE identity (sourceId, kind, role);
 * the contentHash only signals staleness (drifted) — never a silent duplicate
 * (fix #3). Prefix and language come from ProjectConfig (no RU/[Arch] in code, fix #12).
 */
export async function renderIssuePayload(
  input: RenderIssueInput,
  deps: RenderIssueDeps,
): Promise<IntentEnvelope> {
  const { repo, payloads, config, ledger, hash } = deps;
  const from = input.from?.trim();
  if (!from) throw new DomainError('render-issue: missing --from', 1);
  if (!ISSUE_KINDS.includes(input.kind)) {
    throw new DomainError(`render-issue: --kind must be one of ${ISSUE_KINDS.join('|')}`, 1);
  }
  if (input.kind === 'techdesign' && !input.role) {
    throw new DomainError('render-issue: --role is required for --kind techdesign', 1);
  }
  if (input.role && !ISSUE_ROLES.includes(input.role)) {
    throw new DomainError(`render-issue: --role must be one of ${ISSUE_ROLES.join('|')}`, 1);
  }

  const role: string | null = input.role ?? null;
  // ProjectConfig — fail-fast exit 2 if tasks config absent (no hardcoded prefix/language).
  const prefix = config.taskPrefix(input.kind, input.role);
  const language = config.language();

  const basename = await repo.resolveBasename(from);
  if (!basename) throw new DomainError(`render-issue: cannot resolve --from "${from}"`, 2);
  const pages = await repo.loadPages();
  const graph = buildGraph(pages);
  const sourcePage = pages.find((p) => p.basename === basename) ?? null;
  const title = sourcePage?.headings[0] ? cleanTitle(sourcePage.headings[0]) : basename;
  const driverLink = `[[${basename}|${from}]]`;

  // CAP-2 trace links (v0.7): the issue body stays self-contained (inlined excerpts); the
  // command embeds each artifact's Confluence mirror link INLINE at its first mention (v0.7.1 —
  // like the wiki mirror, no separate section). `traceLinks` is the data for that; presentation
  // only (NOT in contentHash, so publishing/refreshing the mirror never drifts an existing issue).
  const { traceLinks, warnings: traceWarnings } = resolveTraceLinks({
    from,
    title,
    sourcePage,
    graph,
    publishedMap: new Map((await ledger.readPages()).map((r) => [r.source, r.page])),
    space: config.confluence()?.space ?? null,
    siteUrl: config.confluenceSiteUrl(),
  });

  const templateName = input.kind === 'arch' ? 'issue-arch.md' : 'issue-techdesign.md';
  const template = await payloads.loadByName(templateName);
  const { output, unresolved } = render(template, {
    prefix,
    title,
    source: basename,
    driver: driverLink,
  });
  const warnings = [
    ...(unresolved.length ? [`unresolved template tokens: ${unresolved.join(', ')}`] : []),
    ...traceWarnings,
  ];

  // Hash a canonical field set (date-free) so re-rendering is stable; editing the
  // driver title changes the hash → drifted.
  const canonical = JSON.stringify({ kind: input.kind, role, prefix, language, title, source: basename, drivers: [driverLink] });
  const contentHash = hash(canonical);

  const existing = (await ledger.readIssues()).find(
    (r) => r.sourceId === from && r.kind === input.kind && r.role === role,
  );

  return {
    kind: input.kind,
    role,
    prefix,
    language,
    title,
    issueTitle: `${prefix} ${title}`,
    sourceId: from,
    drivers: [driverLink],
    traceLinks,
    contentHash,
    payload: output,
    alreadyCreated: existing != null,
    drifted: existing != null && existing.contentHash !== contentHash,
    key: existing?.key ?? null,
    warnings,
  };
}
