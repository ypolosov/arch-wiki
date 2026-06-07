import { DomainError } from '../../domain/errors';
import { requireSlug } from '../../domain/services/KebabSlug';
import { render } from '../../domain/services/TemplateEngine';
import { deepMerge } from '../../domain/services/DeepMerge';
import { ClockPort } from '../ports/ClockPort';
import { FrontmatterParserPort } from '../ports/FrontmatterParserPort';
import { PayloadTemplatePort } from '../ports/PayloadTemplatePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export type QuestionnaireMethod = 'qaw' | 'rozanski' | 'driver-gap';
export const QUESTIONNAIRE_METHODS: readonly QuestionnaireMethod[] = ['qaw', 'rozanski', 'driver-gap'];

export interface QuestionnaireInput {
  method: QuestionnaireMethod;
  topic: string;
  /** Explicit slug (for non-latin topics). */
  slug?: string;
  /** Driver ids this questionnaire relates to (forward-ref placeholders allowed). */
  relatedDrivers?: string[];
  dryRun?: boolean;
}

export interface QuestionnaireDeps {
  repo: WikiRepositoryPort;
  payloads: PayloadTemplatePort;
  clock: ClockPort;
  frontmatter: FrontmatterParserPort;
}

export interface QuestionnaireResult {
  path: string;
  created: boolean;
  method: QuestionnaireMethod;
  warnings: string[];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Scaffold a method-specific questionnaire skeleton into `raw/questionnaires/`.
 * The CLI is the authorized author of this raw skeleton (the guard-path hook only
 * intercepts Edit/Write tool calls, not the CLI process — §4.2). Deterministic;
 * answers are filled by humans and later parsed by `ingest-questionnaire`.
 */
export async function scaffoldQuestionnaire(
  input: QuestionnaireInput,
  deps: QuestionnaireDeps,
): Promise<QuestionnaireResult> {
  const { repo, payloads, clock, frontmatter } = deps;
  if (!QUESTIONNAIRE_METHODS.includes(input.method)) {
    throw new DomainError(
      `unknown questionnaire method "${input.method}" (valid: ${QUESTIONNAIRE_METHODS.join(', ')})`,
      1,
    );
  }
  if (!input.topic?.trim()) throw new DomainError('questionnaire: missing --topic', 1);

  const date = isoDate(clock.now());
  const topicSlug = input.slug?.trim() || requireSlug(input.topic);
  const relPath = `raw/questionnaires/${input.method}-${date}-${topicSlug}.md`;
  if (await repo.exists(relPath)) {
    throw new DomainError(`questionnaire already exists: ${relPath}`, 2);
  }

  const related = input.relatedDrivers ?? [];
  const template = await payloads.loadByName(`questionnaire-${input.method}.md`);
  const { output, unresolved } = render(template, {
    topic: input.topic,
    date,
    related_drivers: related.length ? related.map((d) => `[[${d}]]`).join(', ') : '—',
  });
  const warnings = unresolved.length ? [`unresolved template tokens: ${unresolved.join(', ')}`] : [];

  const doc = frontmatter.parse(output);
  const merged = deepMerge(doc.frontmatter, {
    method: input.method,
    topic: input.topic,
    date,
    status: 'open',
    related_drivers: related,
  });
  const finalOutput = frontmatter.stringify({ frontmatter: merged, content: doc.content });

  if (input.dryRun) {
    return { path: relPath, created: false, method: input.method, warnings };
  }
  await repo.write(relPath, finalOutput);
  return { path: relPath, created: true, method: input.method, warnings };
}
