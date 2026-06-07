import { DomainError } from '../errors';
import { ArtifactId } from './ArtifactId';

export type ArtifactKind =
  | 'use-case'
  | 'quality-attribute'
  | 'constraint'
  | 'concern'
  | 'adr'
  | 'iteration'
  | 'entity'
  | 'concept'
  | 'arc42';

/**
 * The single source of truth for per-type rules. Every use-case reads this
 * instead of hard-coding folders/prefixes/padding. arc42 hub filenames are
 * sensible defaults; ProjectConfig may override them per target.
 */
export interface ArtifactSpec {
  readonly kind: ArtifactKind;
  /** ID prefix (UC/QA/CON/CONC/ADR/ITER); null for unnumbered kinds. */
  readonly prefix: string | null;
  /** Zero-pad width for the number; 0 for unnumbered kinds. */
  readonly pad: number;
  /** Folder under `docs/architecture/`. */
  readonly folder: string;
  /** Build the filename (without folder) from id + slug. */
  readonly filename: (id: ArtifactId | null, slug: string) => string;
  /** Template file name under the plugin's `templates/`. */
  readonly template: string;
  /** Default arc42 hub to backlink into; null = none. Overridable per project. */
  readonly hubFile: string | null;
  /** Canonical frontmatter for validation (type/tags/...). */
  readonly frontmatter: Readonly<Record<string, unknown>>;
}

const named = (slug: string): string => `${slug}.md`;
const prefixed = (id: ArtifactId | null, slug: string): string => {
  if (!id) throw new DomainError('numbered artifact requires an id');
  return `${id.prefix}-${id.padded}-${slug}.md`;
};

export const ARTIFACT_SPECS: Readonly<Record<ArtifactKind, ArtifactSpec>> = {
  'use-case': {
    kind: 'use-case', prefix: 'UC', pad: 3, folder: 'drivers/use-cases',
    filename: prefixed, template: 'use-case.md',
    hubFile: 'arc42/01-introduction-and-goals.md',
    frontmatter: { type: 'use-case', tags: ['uc'] },
  },
  'quality-attribute': {
    kind: 'quality-attribute', prefix: 'QA', pad: 3, folder: 'drivers/quality-attributes',
    filename: prefixed, template: 'quality-attribute.md',
    hubFile: 'arc42/10-quality-requirements.md',
    frontmatter: { type: 'quality-attribute', tags: ['qa'] },
  },
  'constraint': {
    kind: 'constraint', prefix: 'CON', pad: 3, folder: 'drivers/constraints',
    filename: prefixed, template: 'constraint.md',
    hubFile: 'arc42/02-constraints.md',
    frontmatter: { type: 'constraint', tags: ['con'] },
  },
  'concern': {
    kind: 'concern', prefix: 'CONC', pad: 3, folder: 'drivers/concerns',
    filename: prefixed, template: 'concern.md',
    hubFile: 'arc42/08-crosscutting-concepts.md',
    frontmatter: { type: 'concern', tags: ['conc'] },
  },
  'adr': {
    kind: 'adr', prefix: 'ADR', pad: 4, folder: 'adrs',
    // MADR filename: 4-digit, zero-padded, NO `ADR-` prefix.
    filename: (id, slug) => {
      if (!id) throw new DomainError('adr requires an id');
      return `${id.padded}-${slug}.md`;
    },
    template: 'adr.md', hubFile: 'arc42/09-architecture-decisions.md',
    frontmatter: { type: 'adr', status: 'proposed', tags: ['adr', 'adr/proposed'] },
  },
  'iteration': {
    kind: 'iteration', prefix: 'ITER', pad: 2, folder: 'iterations',
    // ITER-NN.md — no slug.
    filename: (id) => {
      if (!id) throw new DomainError('iteration requires an id');
      return `${id.prefix}-${id.padded}.md`;
    },
    template: 'iteration.md', hubFile: 'arc42/04-solution-strategy.md',
    frontmatter: { type: 'iteration', tags: ['iteration'] },
  },
  'entity': {
    kind: 'entity', prefix: null, pad: 0, folder: 'entities',
    filename: (_id, slug) => named(slug), template: 'entity.md', hubFile: null,
    frontmatter: { type: 'entity' },
  },
  'concept': {
    kind: 'concept', prefix: null, pad: 0, folder: 'concepts',
    filename: (_id, slug) => named(slug), template: 'concept.md', hubFile: null,
    frontmatter: { type: 'concept' },
  },
  'arc42': {
    kind: 'arc42', prefix: null, pad: 0, folder: 'arc42',
    filename: (_id, slug) => named(slug), template: 'arc42-hub.md', hubFile: null,
    frontmatter: { type: 'arc42' },
  },
};

/** CLI token aliases → kind. */
export const KIND_ALIASES: Readonly<Record<string, ArtifactKind>> = {
  uc: 'use-case', 'use-case': 'use-case',
  qa: 'quality-attribute', 'quality-attribute': 'quality-attribute',
  con: 'constraint', constraint: 'constraint',
  conc: 'concern', concern: 'concern',
  adr: 'adr',
  iter: 'iteration', iteration: 'iteration',
  entity: 'entity', concept: 'concept', arc42: 'arc42',
};

/** Resolve a CLI token (e.g. `qa`, `ADR`) to its spec; throws on unknown. */
export function resolveKind(token: string): ArtifactSpec {
  const kind = KIND_ALIASES[token.toLowerCase()];
  if (!kind) {
    const valid = Object.keys(KIND_ALIASES).sort().join(', ');
    throw new DomainError(`unknown artifact type "${token}" (valid: ${valid})`, 1);
  }
  return ARTIFACT_SPECS[kind];
}
