import { DomainError } from '../../domain/errors';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface QuestionnaireAnswer {
  /** Nearest preceding heading (the question/section the answer belongs to). */
  section: string;
  /** Driver id the answer explicitly closes (`closes: <id>` tag). */
  closesDriver: string;
}

export interface QuestionnaireContradiction {
  section: string;
  conflict: string;
}

export interface ParseQuestionnaireInput {
  /** raw/questionnaires/<file> to parse. */
  from: string;
}

export interface ParseQuestionnaireDeps {
  repo: WikiRepositoryPort;
}

export interface ParseQuestionnaireResult {
  source: string;
  method: string | null;
  relatedDrivers: string[];
  answers: QuestionnaireAnswer[];
  unanswered: string[];
  contradictions: QuestionnaireContradiction[];
}

const ID = /^[A-Za-z]+-\d+$/;
const HEADING = /^#{1,6}\s+(.+?)\s*$/;
const CLOSES = /(?:^|\s)closes:\s*([A-Za-z]+-\d+)/i;
const CONTRADICTION = /(?:^|\s)contradiction:\s*(.+?)\s*$/i;

/**
 * Deterministically parse an ANSWERED questionnaire into a traceability report.
 * Core attributes answers to drivers via explicit `closes: <id>` tags and computes
 * which related drivers remain unanswered; untagged attribution stays an LLM job
 * (§4.3). Fail-fast (fix #5): missing/out-of-raw/absent `--from`, an unanswered
 * (`status: open`) questionnaire, or a questionnaire-shaped frontmatter missing
 * method/related_drivers all throw — never a silent empty trace.
 */
export async function parseQuestionnaire(
  input: ParseQuestionnaireInput,
  deps: ParseQuestionnaireDeps,
): Promise<ParseQuestionnaireResult> {
  const { repo } = deps;
  const from = input.from?.trim();
  if (!from) throw new DomainError('ingest-questionnaire: missing --from', 1);
  if (!from.startsWith('raw/')) {
    throw new DomainError(`ingest-questionnaire: --from must be under raw/: ${from}`, 2);
  }
  if (!(await repo.exists(from))) {
    throw new DomainError(`ingest-questionnaire: --from not found: ${from}`, 2);
  }

  const { frontmatter, content } = await repo.readParsed(from);
  const hasFm = Object.keys(frontmatter).length > 0;
  let method: string | null = null;
  let relatedDrivers: string[] = [];

  if (hasFm) {
    const status = String((frontmatter as { status?: unknown }).status ?? '').toLowerCase();
    if (status === 'open') {
      throw new DomainError('ingest-questionnaire: questionnaire not yet answered (status: open)', 2);
    }
    const m = (frontmatter as { method?: unknown }).method;
    if (typeof m !== 'string' || !m) {
      throw new DomainError('ingest-questionnaire: questionnaire missing method frontmatter', 2);
    }
    method = m;
    const rd = (frontmatter as { related_drivers?: unknown }).related_drivers;
    if (!Array.isArray(rd)) {
      throw new DomainError('ingest-questionnaire: questionnaire missing related_drivers frontmatter', 2);
    }
    relatedDrivers = rd.map(String).filter((d) => ID.test(d));
  }

  const answers: QuestionnaireAnswer[] = [];
  const contradictions: QuestionnaireContradiction[] = [];
  let section = '';
  for (const line of content.split('\n')) {
    const h = HEADING.exec(line);
    if (h) {
      section = h[1]!;
      continue;
    }
    const c = CLOSES.exec(line);
    if (c) answers.push({ section, closesDriver: c[1]! });
    const x = CONTRADICTION.exec(line);
    if (x) contradictions.push({ section, conflict: x[1]! });
  }

  const closed = new Set(answers.map((a) => a.closesDriver));
  const unanswered = relatedDrivers.filter((d) => !closed.has(d)).sort();
  answers.sort((a, b) => a.closesDriver.localeCompare(b.closesDriver) || a.section.localeCompare(b.section));
  contradictions.sort((a, b) => a.section.localeCompare(b.section) || a.conflict.localeCompare(b.conflict));

  return { source: from, method, relatedDrivers, answers, unanswered, contradictions };
}
