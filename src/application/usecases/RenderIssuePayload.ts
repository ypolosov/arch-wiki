import { DomainError } from '../../domain/errors';
import { render } from '../../domain/services/TemplateEngine';
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

export interface IntentEnvelope {
  kind: IssueKind;
  role: string | null;
  prefix: string;
  language: string;
  title: string;
  issueTitle: string;
  sourceId: string;
  drivers: string[];
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
  const page = (await repo.loadPages()).find((p) => p.basename === basename);
  const title = page?.headings[0] ? cleanTitle(page.headings[0]) : basename;
  const driverLink = `[[${basename}|${from}]]`;

  const templateName = input.kind === 'arch' ? 'issue-arch.md' : 'issue-techdesign.md';
  const template = await payloads.loadByName(templateName);
  const { output, unresolved } = render(template, {
    prefix,
    title,
    source: basename,
    driver: driverLink,
  });
  const warnings = unresolved.length ? [`unresolved template tokens: ${unresolved.join(', ')}`] : [];

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
    contentHash,
    payload: output,
    alreadyCreated: existing != null,
    drifted: existing != null && existing.contentHash !== contentHash,
    key: existing?.key ?? null,
    warnings,
  };
}
