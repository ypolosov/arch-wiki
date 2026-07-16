import { DomainError } from '../../domain/errors';
import { ProjectConfig } from '../../domain/services/ProjectConfig';
import {
  C4ElementSpec,
  C4ViewSpec,
  renderC4Element,
  renderC4View,
} from '../../domain/services/C4Scaffold';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface ScaffoldC4Deps {
  repo: WikiRepositoryPort;
  /** Supplies `c4().dir`; throws exit 2 when the project has no `[c4]` block (fail-fast, no guess). */
  config: ProjectConfig;
}

export interface ScaffoldC4Result {
  /** Wiki-relative path of the scaffolded `.c4` file. */
  path: string;
  /** False when the file already existed — it is NEVER overwritten (non-destructive). */
  created: boolean;
  content: string;
}

/** Where the project's LikeC4 sources live. Fail-fast with a self-explanatory hint — never a guess. */
function c4Dir(config: ProjectConfig): string {
  try {
    return config.c4().dir.replace(/\/+$/, '');
  } catch {
    throw new DomainError(
      'scaffold-c4-* needs a [c4] config so Core knows where your LikeC4 sources live — add ' +
        '{"c4":{"dir":"c4/src","validate":"npm run validate"}} to docs/architecture/.arch-wiki/config.json',
      2,
    );
  }
}

/**
 * Scaffold ONE C4 element as a separate, additive `extend` file. You supply the semantics (parent,
 * kind, title); Core supplies the DSL syntax and the file placement. The hand-authored `model.c4` is
 * never edited — LikeC4 merges the `extend` block into the single model. Idempotent: an existing
 * file is left exactly as-is (yours to edit), and reported with `created: false`.
 */
export async function scaffoldC4Element(
  spec: C4ElementSpec,
  deps: ScaffoldC4Deps,
): Promise<ScaffoldC4Result> {
  const content = renderC4Element(spec); // validates the spec first — no file on bad input
  const path = `${c4Dir(deps.config)}/${spec.parent}.${spec.id}.c4`;
  if (await deps.repo.exists(path)) return { path, created: false, content };
  await deps.repo.write(path, content);
  return { path, created: true, content };
}

/**
 * Scaffold ONE C4 view as a separate, additive `views` file. Existing views — and their curated
 * manual layouts — are never touched. Idempotent, same as the element scaffolder.
 */
export async function scaffoldC4View(spec: C4ViewSpec, deps: ScaffoldC4Deps): Promise<ScaffoldC4Result> {
  const content = renderC4View(spec);
  const path = `${c4Dir(deps.config)}/view-${spec.id}.c4`;
  if (await deps.repo.exists(path)) return { path, created: false, content };
  await deps.repo.write(path, content);
  return { path, created: true, content };
}
