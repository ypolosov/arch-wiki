import { DomainError } from '../../domain/errors';
import { ARTIFACT_SPECS, ArtifactKind } from '../../domain/model/ArtifactType';
import { buildGraph } from '../../domain/model/Graph';
import { WikiPage } from '../../domain/model/WikiPage';
import { ProjectConfig } from '../../domain/services/ProjectConfig';
import {
  CrossLink,
  DEFAULT_EXCLUDE,
  MirrorExclude,
  ProtectedSpan,
  extractGlossaryTerms,
  isPageExcluded,
  jiraBrowseUrl,
  neutralizeRepoRelativeLinks,
  neutralizeRepoPaths,
  parentSourceOf,
  protectStructuralSpans,
  resolveCrossLinks,
  sortParentFirst,
  splitTitle,
  stripSourceProvenanceLines,
  stripSourcesSection,
  stubLocalImages,
} from '../../domain/services/ConfluenceTree';
import { SourceLoss, sourceLoss } from '../../domain/services/SourceLoss';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface PageEnvelope {
  /** Wiki-relative source path — the ledger key (NOT basename; avoids collisions). */
  source: string;
  basename: string;
  title: string;
  /** Artifact id prefix of `title` (e.g. `UC-014:`), kept byte-exact in the RU projection. */
  titlePrefix: string;
  /** Translatable part of `title` (e.g. `Login`); publish translates only this, then recombines with `titlePrefix`. */
  titleLabel: string;
  /** Confluence space KEY (for the /wiki/spaces/<KEY>/pages/<id> cross-link URLs) — NOT the numeric create id. */
  spaceKey: string;
  /** Parent page's source relPath, or null for the root. */
  parentSource: string | null;
  language: string | null;
  /**
   * Page body. English markdown with `[[wikilinks]]` resolved to cross-links — UNLESS
   * the mirror `language` is set, in which case structural spans (code, link URLs,
   * artifact ids) are masked to `%%AWP<n>%%` placeholders for the translation step;
   * restore them with `restore` (via `finalize-confluence`) before publishing.
   */
  body: string;
  crossLinks: CrossLink[];
  /** Structural placeholders to restore after translation (empty when not translating). */
  restore: ProtectedSpan[];
  /** Canonical, date-free hash over title+parentSource+English body (+language when set). */
  contentHash: string;
  alreadyPublished: boolean;
  /** alreadyPublished && the ledgered hash differs (content changed → re-publish). */
  drifted: boolean;
  pageId: string | null;
  /**
   * Confluence page version recorded at the last publish (destination-drift baseline, v0.8);
   * null if never published / pre-0.8 ledger. The orchestrator compares the LIVE version
   * against this before update and refuses to clobber a higher (hand-edited) live version.
   */
  ledgerPageVersion: number | null;
  /** Reverse trace edge (v0.8): Jira issues that realize this artifact (from `realized_by` frontmatter). */
  realizedBy: IssueRef[];
  warnings: string[];
  /**
   * Typed Controlled-Semantic-Coarsening losses (FPF A.6.3.CSC) — a machine-readable classification
   * of WHAT the mirror deliberately dropped/renamed from the git canon (a subset of `warnings`, whose
   * human strings stay byte-identical). Publication-state notices (unresolved cross-links, un-linked
   * realizing issues) are NOT source losses and stay in `warnings` only.
   */
  sourceLoss: SourceLoss[];
}

/** A realizing issue link for the reverse trace edge on a mirror page. */
export interface IssueRef {
  key: string;
  /** Absolute Jira browse URL, or null if no jira/confluence siteUrl is configured. */
  url: string | null;
}

export interface MirrorPlan {
  /** Confluence space KEY (cross-link URLs + display). */
  spaceKey: string;
  /** NUMERIC Confluence space id for createConfluencePage; null if unset → preflight warns. */
  spaceId: string | null;
  /** Confluence cloudId (create/update require it); null if unset → preflight warns. */
  cloudId: string | null;
  /** Mirror presentation language (`confluence.language`), or null = publish English as-is. */
  language: string | null;
  /** Translation denylist (config preserveTerms + glossary bold terms); empty when not translating. */
  preserveTerms: string[];
  pages: PageEnvelope[];
  /** Published-pages ledger rows whose source no longer maps to a live included page. */
  orphans: { page: string; source: string }[];
  /** Plan-level preflight warnings (e.g. publishable-but-incomplete confluence config). */
  warnings: string[];
}

export interface RenderConfluenceDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
  config: ProjectConfig;
  hash: (content: string) => string;
}

function normalizeBody(s: string): string {
  return `${s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '')}\n`;
}

function titleOf(page: WikiPage): string {
  return page.headings[0]?.trim() || page.basename;
}

/**
 * CAP-2 render step (pure-ish; MCP-free, invariant 6): produce the deterministic
 * full-mirror plan — every visible wiki page → a `PageEnvelope` (tree position +
 * resolved cross-links + canonical hash + drift/idempotency vs the published-pages
 * ledger) plus the orphan deletion candidates. The orchestrator (`publish.md`)
 * performs create/update/delete via the Confluence MCP, then `record-page` writes
 * the ledger. REPLACES the §7 showcase: docs/architecture is truth, Confluence is
 * a read-only 1:1 mirror with a visibility filter (§12.10 Decision A).
 */
export async function renderConfluencePayload(deps: RenderConfluenceDeps): Promise<MirrorPlan> {
  const conf = deps.config.confluence();
  const spaceKey = conf?.space;
  if (!spaceKey) {
    throw new DomainError(
      'project has no [integrations.confluence.space]; required by render-confluence',
      2,
    );
  }
  const language = conf?.language ?? null;
  const spaceIdNumeric = deps.config.confluenceSpaceId();
  const cloudId = deps.config.confluenceCloudId();
  const jiraSiteUrl = deps.config.jiraSiteUrl();

  // Preflight (v0.8): the confluence block is independently-optional, but a working publish
  // needs the KEY + numeric spaceId + cloudId. Surface what is missing ONCE, up front, instead
  // of failing mid-publish as an opaque MCP error.
  const planWarnings: string[] = [];
  if (!spaceIdNumeric) {
    planWarnings.push(
      `integrations.confluence.spaceId (numeric) is not set — createConfluencePage needs it (the space KEY "${spaceKey}" returns HTTP 400); look it up once via getConfluenceSpaces(keys:["${spaceKey}"])`,
    );
  }
  if (!cloudId) {
    planWarnings.push('integrations.confluence.cloudId is not set — create/updateConfluencePage require it');
  }

  const rawExclude = (conf as { exclude?: Partial<MirrorExclude> }).exclude;
  const exclude: MirrorExclude = {
    statuses: rawExclude?.statuses ?? DEFAULT_EXCLUDE.statuses,
    basenames: rawExclude?.basenames ?? DEFAULT_EXCLUDE.basenames,
  };

  const pages = await deps.repo.loadPages();
  const graph = buildGraph(pages);

  // Translation denylist (only when translating): config preserveTerms + glossary bold terms.
  let preserveTerms: string[] = [];
  if (language) {
    const configTerms = (conf as { preserveTerms?: string[] }).preserveTerms ?? [];
    const glossaryPage = pages.find((p) => p.basename === 'glossary') ?? null;
    const glossaryTerms = glossaryPage
      ? extractGlossaryTerms((await deps.repo.readParsed(glossaryPage.relPath)).content)
      : [];
    preserveTerms = [...new Set([...configTerms, ...glossaryTerms])].sort((a, b) => a.localeCompare(b));
  }

  const included = pages.filter((p) => !isPageExcluded(p, exclude));
  const includedSources = new Set(included.map((p) => p.relPath));

  const hubMap = new Map<ArtifactKind, string | null>();
  for (const kind of Object.keys(ARTIFACT_SPECS) as ArtifactKind[]) {
    hubMap.set(kind, deps.config.hubFile(kind));
  }
  const indexPage = included.find((p) => p.basename === 'index') ?? null;
  const indexSource = indexPage?.relPath ?? null;

  // Section number (`04`) → included arc42 hub relPath, so non-numbered pages (concepts,
  // entities, glossary, utility-tree) nest under an arc42 section instead of cluttering the
  // root TOC (the root parents arc42 §1–§12 only).
  const arc42Hubs = new Map<string, string>();
  for (const p of included) {
    if (p.folder !== 'arc42') continue;
    const m = p.basename.match(/^(\d{2})-/);
    if (m) arc42Hubs.set(m[1]!, p.relPath);
  }

  const parents = new Map<string, string | null>();
  for (const p of included) {
    parents.set(p.relPath, parentSourceOf(p, hubMap, includedSources, indexSource, arc42Hubs));
  }

  const ledgerRows = await deps.ledger.readPages();
  const publishedMap = new Map<string, string>(); // source → page id
  const ledgerHash = new Map<string, string>();
  const ledgerVersion = new Map<string, number>(); // source → recorded Confluence page version
  for (const r of ledgerRows) {
    publishedMap.set(r.source, r.page);
    ledgerHash.set(r.source, r.contentHash);
    if (r.pageVersion != null) ledgerVersion.set(r.source, r.pageVersion);
  }
  // Reverse trace edge (v0.8): map each issue key → its system, so a key from `realized_by`
  // gets a Jira browse URL only when it is actually a Jira issue (gitlab/other → no URL yet).
  const issueSystem = new Map<string, string>();
  for (const r of await deps.ledger.readIssues()) issueSystem.set(r.key, r.system);

  const envelopes = new Map<string, PageEnvelope>();
  for (const p of included) {
    const parsed = await deps.repo.readParsed(p.relPath);
    // Curate out the git source-of-truth BEFORE the content hash + RU mask, so the mirror never
    // exposes repo internals (gt feedback v0.8.1/v0.8.2; affected pages drift once, re-publish clean):
    //   1. the `## Sources` provenance section (v0.8.1),
    //   2. `**Source:** raw/…` author fields (A),
    //   3. repo paths in prose/code/parentheticals (B).
    const { body: noSources, stripped: sourcesStripped } = stripSourcesSection(normalizeBody(parsed.content));
    const { body: noFields, stripped: fieldsStripped } = stripSourceProvenanceLines(noSources);
    const { body: resolved, crossLinks } = resolveCrossLinks(
      noFields,
      graph,
      publishedMap,
      includedSources,
      spaceKey, // the space KEY → /wiki/spaces/<key>/pages/<id> (NOT the numeric create id)
      // Translation mode reserves a masked-link slot for not-yet-published targets so the
      // translatable body is stable across the 2-pass publish (no re-translation on pass 2).
      language != null,
    );
    // Repo-relative md links (../iterations/, CLAUDE.md …) are dead hrefs in Confluence → plain text.
    // MUST run BEFORE neutralizeRepoPaths (v0.8.3 Defect 1): otherwise B strips the repo path out of a
    // link LABEL (`[c4/src/x.c4](../c4/src/x.c4)` → `[](…)`), the now-empty label no longer matches
    // MD_LINK_RE, and the path SURVIVES in the dead URL (11 broken links across 6 pages on gt). Running
    // the link neutraliser first collapses the link to an inline-code label, which B then removes clean.
    const { body: linkClean, stripped } = neutralizeRepoRelativeLinks(resolved);
    // Curate out repo-internal paths in prose/code/parentheticals (B). Runs AFTER the link neutraliser
    // (sees collapsed inline-code labels, not raw link syntax) and BEFORE stubLocalImages (so B does not
    // eat the C4-diagram stub's `src`, which is kept by design).
    const { body: curated, neutralized: pathsNeutralized } = neutralizeRepoPaths(linkClean);
    // Local image embeds (C4 diagrams) → deterministic placeholder (MCP has no attachment upload).
    const { body: stubbedBody, stubbed } = stubLocalImages(curated);

    // Reverse trace edge: the Jira issues that realize this artifact (`realized_by` frontmatter,
    // written by record-issue). Append a Core-rendered line so the mirror page links back to its
    // issue — part of the body so it drifts/re-publishes when the realizing issue changes.
    const realizedKeys = Array.isArray((parsed.frontmatter as { realized_by?: unknown }).realized_by)
      ? (parsed.frontmatter as { realized_by: unknown[] }).realized_by.map(String)
      : [];
    const realizedBy: IssueRef[] = realizedKeys.map((key) => {
      const sys = issueSystem.get(key);
      const url = jiraSiteUrl && (sys === undefined || sys === 'jira') ? jiraBrowseUrl(jiraSiteUrl, key) : null;
      return { key, url };
    });
    const linked = realizedBy.filter((r) => r.url);
    // Wrap the key in inline code so the RU projection protects it byte-exact (a Jira key like
    // `GRMTCH-5` is not matched by the artifact-id regex, so without this it could be translated — R7).
    const reverseEdge = linked.length
      ? `\n\n**Realized by:** ${linked.map((r) => `[\`${r.key}\`](${r.url})`).join(', ')}\n`
      : '';
    const englishBody = `${stubbedBody.replace(/\n+$/, '')}${reverseEdge ? reverseEdge : '\n'}`;

    const title = titleOf(p);
    const { prefix: titlePrefix, label: titleLabel } = splitTitle(title);
    const parentSource = parents.get(p.relPath) ?? null;
    // Hash over the ENGLISH source (+ language when translating). Stable across runs
    // (translation is not in the key → no oscillation); a non-translating wiki keeps the
    // exact 0.5.x payload (no spurious drift on upgrade); enabling a language drifts once.
    const contentHash = deps.hash(
      JSON.stringify(
        language ? { title, parentSource, body: englishBody, language } : { title, parentSource, body: englishBody },
      ),
    );
    // Translating → mask structural spans AND denylist terms for the LLM; else ship English as-is.
    const { masked, restore } = language
      ? protectStructuralSpans(englishBody, preserveTerms)
      : { masked: englishBody, restore: [] as ProtectedSpan[] };
    const alreadyPublished = publishedMap.has(p.relPath);
    const warnings: string[] = [];
    // Typed Controlled-Semantic-Coarsening losses (FPF A.6.3.CSC). The human `message` of each is
    // byte-identical to the historical free-text warning and appended in the SAME order, so the
    // `warnings[]` display surface is unchanged — the typing is purely additive.
    const losses: SourceLoss[] = [];
    if (crossLinks.some((c) => !c.resolved)) {
      warnings.push(
        language != null
          ? 'some cross-link targets are not yet published (reserved as pending links; resolve on pass 2)'
          : 'some cross-link targets are not yet published (rendered as plain text)',
      );
    }
    if (stripped.length > 0) losses.push(sourceLoss('repo-relative-link-neutralized', stripped));
    if (stubbed.length > 0) losses.push(sourceLoss('local-image-stubbed', stubbed));
    if (sourcesStripped) losses.push(sourceLoss('provenance-section-stripped'));
    if (fieldsStripped) losses.push(sourceLoss('provenance-field-stripped'));
    if (pathsNeutralized) losses.push(sourceLoss('repo-path-renamed'));
    for (const l of losses) warnings.push(l.message);
    const unlinked = realizedBy.filter((r) => !r.url);
    if (unlinked.length > 0) {
      // Two distinct causes (R6): no site URL at all (every key omitted) vs a known non-Jira
      // system (only those keys omitted — they have no browse-URL scheme yet).
      warnings.push(
        jiraSiteUrl
          ? `realized_by non-Jira issue(s) — no browse link yet: ${unlinked.map((r) => r.key).join(', ')}`
          : `realized_by issue(s) present but no jira.siteUrl/confluence.siteUrl — reverse trace link omitted: ${unlinked.map((r) => r.key).join(', ')}`,
      );
    }
    envelopes.set(p.relPath, {
      source: p.relPath,
      basename: p.basename,
      title,
      titlePrefix,
      titleLabel,
      spaceKey,
      parentSource,
      language,
      body: masked,
      crossLinks,
      restore,
      contentHash,
      alreadyPublished,
      drifted: alreadyPublished && ledgerHash.get(p.relPath) !== contentHash,
      pageId: publishedMap.get(p.relPath) ?? null,
      ledgerPageVersion: ledgerVersion.get(p.relPath) ?? null,
      realizedBy,
      warnings,
      sourceLoss: losses,
    });
  }

  const ordered = sortParentFirst([...envelopes.keys()], parents).map((s) => envelopes.get(s)!);
  const orphans = ledgerRows
    .filter((r) => !includedSources.has(r.source))
    .map((r) => ({ page: r.page, source: r.source }))
    .sort((a, b) => a.source.localeCompare(b.source));

  return {
    spaceKey,
    spaceId: spaceIdNumeric,
    cloudId,
    language,
    preserveTerms,
    pages: ordered,
    orphans,
    warnings: planWarnings,
  };
}
