import { DomainError } from '../../domain/errors';
import { upsertKeyedRow, KeyedTableSpec } from '../../domain/services/KeyedTable';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export type KanbanColumn = 'backlog' | 'in-progress' | 'done';
export const KANBAN_COLUMNS: readonly KanbanColumn[] = ['backlog', 'in-progress', 'done'];

export interface UpdateKanbanInput {
  /** Card id/basename to add (rendered as `[[id]]`). */
  add: string;
  /** Target column. Absent on a new card ⇒ backlog (domain-correct initial state). */
  column?: KanbanColumn;
}

export interface UpdateKanbanDeps {
  repo: WikiRepositoryPort;
}

export interface UpdateKanbanResult {
  path: string;
  created: boolean;
  changed: boolean;
  column: KanbanColumn;
}

const KANBAN_FILE = 'kanban.md';
const HEADER = '| Card | Column |\n| --- | --- |\n';
const SPEC: KeyedTableSpec = {
  headerMark: '| Card |',
  header: HEADER,
  scaffold:
    '---\ntype: kanban\ntags: [kanban]\n---\n\n' +
    '# Kanban\n\n' +
    'Backlog of drivers and tasks. Maintained by `arch-wiki update-kanban` —\n' +
    'one card per id; moving a card needs an explicit `--column`.\n\n' +
    HEADER,
};

/** Parse the column cell from an existing kanban row line. */
function columnOf(line: string): KanbanColumn {
  const m = /\|\s*([a-z-]+)\s*\|?\s*$/.exec(line.trim());
  const c = m?.[1];
  return (KANBAN_COLUMNS as readonly string[]).includes(c ?? '') ? (c as KanbanColumn) : 'backlog';
}

/**
 * Idempotently add a card to `kanban.md`, keyed by id. Adding an id already on the
 * board is a no-op UNLESS an explicit `--column` moves it (intent stays the source
 * of truth; moves are never automatic). Deterministic.
 */
export async function updateKanban(
  input: UpdateKanbanInput,
  deps: UpdateKanbanDeps,
): Promise<UpdateKanbanResult> {
  const { repo } = deps;
  const id = input.add.trim();
  if (!id) throw new DomainError('update-kanban: missing --add', 1);
  if (input.column && !KANBAN_COLUMNS.includes(input.column)) {
    throw new DomainError(`update-kanban: invalid --column "${input.column}"`, 1);
  }

  const exists = await repo.exists(KANBAN_FILE);
  const content = exists ? await repo.read(KANBAN_FILE) : null;
  const keyLine = `[[${id}]]`;

  // Card already present + no explicit column ⇒ no-op (never auto-move).
  if (content != null && content.includes(keyLine) && !input.column) {
    const cur = content.split('\n').find((l) => l.includes(keyLine))!;
    return { path: KANBAN_FILE, created: false, changed: false, column: columnOf(cur) };
  }

  const column: KanbanColumn = input.column ?? 'backlog';
  const row = `| [[${id}]] | ${column} |`;
  const r = upsertKeyedRow(content, keyLine, row, SPEC);
  if (r.changed) await repo.write(KANBAN_FILE, r.content);
  return { path: KANBAN_FILE, created: !exists, changed: r.changed, column };
}
