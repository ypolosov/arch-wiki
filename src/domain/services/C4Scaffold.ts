import { DomainError } from '../errors';

/**
 * Deterministic LikeC4 DSL rendering for `scaffold-c4-element` / `scaffold-c4-view`.
 *
 * **Scaffold, not generate.** Core never infers structure from prose and never rewrites the
 * hand-authored `*.c4`: you supply the semantics (parent, kind, title), Core supplies the syntax.
 * Both renderers emit a SEPARATE, additive file — an element via `extend <fqn> { … }`, a view via its
 * own `views { … }` block — which LikeC4 merges into the one model. Existing sources (and their
 * curated layouts) are never touched. Pure; no I/O.
 */

const ID_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FQN_RE = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

/** Quote a DSL label. LikeC4 accepts '…' or "…"; pick the one the text does not contain. */
function quote(s: string): string {
  const t = s.trim();
  if (!t) throw new DomainError('c4 label must not be empty', 1);
  if (!t.includes("'")) return `'${t}'`;
  if (!t.includes('"')) return `"${t}"`;
  throw new DomainError(`c4 label contains both ' and " and cannot be quoted: ${t}`, 1);
}

function assertId(value: string, flag: string, hint: string): void {
  if (!ID_RE.test(value)) throw new DomainError(`${flag} must be a DSL identifier (${hint}), got "${value}"`, 1);
}

function assertFqn(value: string, flag: string): void {
  if (!FQN_RE.test(value)) {
    throw new DomainError(`${flag} must be a fully-qualified element id (e.g. product.gaming), got "${value}"`, 1);
  }
}

export interface C4ElementSpec {
  /** Fully-qualified id of the parent to extend, e.g. `product.gaming`. */
  parent: string;
  /** Local id of the new element, e.g. `payments`. */
  id: string;
  /** Element kind — must be declared in the project's `specification.c4`. */
  kind: string;
  title: string;
  technology?: string;
  /** Tag names (without `#`), e.g. `planned` — a project convention; Core does not read them. */
  tags?: readonly string[];
}

export function renderC4Element(s: C4ElementSpec): string {
  assertFqn(s.parent, '--parent');
  assertId(s.id, '--id', 'letters/digits/underscore, not starting with a digit');
  assertId(s.kind, '--kind', 'a kind declared in specification.c4');
  // ORDER MATTERS: tags must precede every other property in an element body — LikeC4's grammar
  // rejects `#tag` after `technology` ("Expecting token of type '}' but found `#`"). Verified against
  // the real `likec4 validate`; do not reorder.
  const body: string[] = [];
  for (const raw of s.tags ?? []) {
    const tag = raw.replace(/^#/, '');
    assertId(tag, '--tags', 'a tag declared in specification.c4');
    body.push(`      #${tag}`);
  }
  if (s.technology) body.push(`      technology ${quote(s.technology)}`);
  const inner = body.length ? ` {\n${body.join('\n')}\n    }` : '';
  return [
    '// Scaffolded by `arch-wiki scaffold-c4-element` — edit freely, this file is yours.',
    '// ADDITIVE: `extend` adds to the model from a separate file; the hand-authored sources are',
    '// untouched. The kind must be declared in specification.c4. Run `npm run validate` after editing.',
    'model {',
    `  extend ${s.parent} {`,
    `    ${s.id} = ${s.kind} ${quote(s.title)}${inner}`,
    '  }',
    '}',
    '',
  ].join('\n');
}

export interface C4ViewSpec {
  /** View id, e.g. `payments` — referenced from the arc42 hub as `` `view payments` ``. */
  id: string;
  title?: string;
  /** Optional scope: `view <id> of <fqn>` inherits that element's scope. */
  of?: string;
}

export function renderC4View(s: C4ViewSpec): string {
  assertId(s.id, '--id', 'letters/digits/underscore, not starting with a digit');
  if (s.of) assertFqn(s.of, '--of');
  const lines = ['views {', `  view ${s.id}${s.of ? ` of ${s.of}` : ''} {`];
  if (s.title) lines.push(`    title ${quote(s.title)}`);
  lines.push('    include *', '  }', '}');
  return [
    '// Scaffolded by `arch-wiki scaffold-c4-view` — edit the predicates, this file is yours.',
    '// ADDITIVE: a NEW view in its own file; existing views and their curated layouts are untouched.',
    '// Narrow it with predicates, e.g. `exclude element.tag = #planned` for an as-built projection.',
    '// Show it from the matching arc42 hub as `view ' + s.id + '` so `validate-c4` can check the link.',
    ...lines,
    '',
  ].join('\n');
}
