import { DomainError } from '../../domain/errors';
import { upsertKeyedRow, KeyedTableSpec } from '../../domain/services/KeyedTable';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface UpdateUtilityTreeInput {
  /** Quality-attribute driver id (rendered as `[[id]]`; unknown ⇒ placeholder). */
  from: string;
  /** Quality scenario one-liner. */
  scenario?: string;
  /** Priority marker (e.g. H/M/L or H,H). */
  priority?: string;
}

export interface UpdateUtilityTreeDeps {
  repo: WikiRepositoryPort;
}

export interface UpdateUtilityTreeResult {
  path: string;
  created: boolean;
  changed: boolean;
}

const FILE = 'utility-tree.md';
const HEADER = '| Driver | Scenario | Priority |\n| --- | --- | --- |\n';
const SPEC: KeyedTableSpec = {
  headerMark: '| Driver |',
  header: HEADER,
  scaffold:
    '---\ntype: utility-tree\ntags: [utility-tree]\n---\n\n' +
    '# Utility Tree\n\n' +
    'QAW output. Maintained by `arch-wiki update-utility-tree` — one row per\n' +
    'quality-attribute driver, keyed by id.\n\n' +
    HEADER,
};

/** Markdown-table-safe single cell. */
function cell(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
}

/**
 * Idempotently upsert a `(driver → scenario → priority)` row into `utility-tree.md`,
 * keyed by driver id. The id need not exist yet (forward-reference placeholder).
 * Deterministic.
 */
export async function updateUtilityTree(
  input: UpdateUtilityTreeInput,
  deps: UpdateUtilityTreeDeps,
): Promise<UpdateUtilityTreeResult> {
  const { repo } = deps;
  const from = input.from.trim();
  if (!from) throw new DomainError('update-utility-tree: missing --from', 1);

  const exists = await repo.exists(FILE);
  const content = exists ? await repo.read(FILE) : null;
  const keyLine = `[[${from}]]`;
  const row = `| [[${from}]] | ${cell(input.scenario ?? '') || '—'} | ${cell(input.priority ?? '') || '—'} |`;
  const r = upsertKeyedRow(content, keyLine, row, SPEC);
  if (r.changed) await repo.write(FILE, r.content);
  return { path: FILE, created: !exists, changed: r.changed };
}
