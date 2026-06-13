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
  neutralizeRepoRelativeLinks,
  parentSourceOf,
  protectStructuralSpans,
  resolveCrossLinks,
  sortParentFirst,
  splitTitle,
} from '../../domain/services/ConfluenceTree';
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
  spaceId: string;
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
  warnings: string[];
}

export interface MirrorPlan {
  spaceId: string;
  /** Mirror presentation language (`confluence.language`), or null = publish English as-is. */
  language: string | null;
  /** Translation denylist (config preserveTerms + glossary bold terms); empty when not translating. */
  preserveTerms: string[];
  pages: PageEnvelope[];
  /** Published-pages ledger rows whose source no longer maps to a live included page. */
  orphans: { page: string; source: string }[];
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
  const spaceId = conf?.space;
  if (!spaceId) {
    throw new DomainError(
      'project has no [integrations.confluence.space]; required by render-confluence',
      2,
    );
  }
  const language = conf?.language ?? null;

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

  const parents = new Map<string, string | null>();
  for (const p of included) {
    parents.set(p.relPath, parentSourceOf(p, hubMap, includedSources, indexSource));
  }

  const ledgerRows = await deps.ledger.readPages();
  const publishedMap = new Map<string, string>(); // source → page id
  const ledgerHash = new Map<string, string>();
  for (const r of ledgerRows) {
    publishedMap.set(r.source, r.page);
    ledgerHash.set(r.source, r.contentHash);
  }

  const envelopes = new Map<string, PageEnvelope>();
  for (const p of included) {
    const parsed = await deps.repo.readParsed(p.relPath);
    const { body: resolved, crossLinks } = resolveCrossLinks(
      normalizeBody(parsed.content),
      graph,
      publishedMap,
      includedSources,
      spaceId, // confluence().space is the space KEY → /wiki/spaces/<key>/pages/<id>
      // Translation mode reserves a masked-link slot for not-yet-published targets so the
      // translatable body is stable across the 2-pass publish (no re-translation on pass 2).
      language != null,
    );
    // Repo-relative md links (../iterations/, CLAUDE.md …) are dead hrefs in Confluence → plain text.
    const { body: englishBody, stripped } = neutralizeRepoRelativeLinks(resolved);
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
    // Translating → mask structural spans for the LLM; else ship English as-is.
    const { masked, restore } = language
      ? protectStructuralSpans(englishBody)
      : { masked: englishBody, restore: [] as ProtectedSpan[] };
    const alreadyPublished = publishedMap.has(p.relPath);
    const warnings: string[] = [];
    if (crossLinks.some((c) => !c.resolved)) {
      warnings.push(
        language != null
          ? 'some cross-link targets are not yet published (reserved as pending links; resolve on pass 2)'
          : 'some cross-link targets are not yet published (rendered as plain text)',
      );
    }
    if (stripped.length > 0) {
      warnings.push(`neutralized ${stripped.length} repo-relative link(s) to plain text: ${stripped.join(', ')}`);
    }
    envelopes.set(p.relPath, {
      source: p.relPath,
      basename: p.basename,
      title,
      titlePrefix,
      titleLabel,
      spaceId,
      parentSource,
      language,
      body: masked,
      crossLinks,
      restore,
      contentHash,
      alreadyPublished,
      drifted: alreadyPublished && ledgerHash.get(p.relPath) !== contentHash,
      pageId: publishedMap.get(p.relPath) ?? null,
      warnings,
    });
  }

  const ordered = sortParentFirst([...envelopes.keys()], parents).map((s) => envelopes.get(s)!);
  const orphans = ledgerRows
    .filter((r) => !includedSources.has(r.source))
    .map((r) => ({ page: r.page, source: r.source }))
    .sort((a, b) => a.source.localeCompare(b.source));

  return { spaceId, language, preserveTerms, pages: ordered, orphans };
}
