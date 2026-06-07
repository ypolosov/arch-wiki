import { ArtifactId } from '../../domain/model/ArtifactId';
import { ArtifactSpec } from '../../domain/model/ArtifactType';
import { DomainError } from '../../domain/errors';
import { nextId } from '../../domain/services/IdAllocator';
import { requireSlug } from '../../domain/services/KebabSlug';
import { render } from '../../domain/services/TemplateEngine';
import { ClockPort } from '../ports/ClockPort';
import { TemplatePort } from '../ports/TemplatePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface ScaffoldInput {
  spec: ArtifactSpec;
  title: string;
  slug?: string;
  drivers?: string[];
  dryRun?: boolean;
}

export interface ScaffoldDeps {
  repo: WikiRepositoryPort;
  templates: TemplatePort;
  clock: ClockPort;
}

export interface ScaffoldResult {
  id: string | null;
  path: string;
  created: boolean;
  hubUpdated: boolean;
  wired: string[];
  unresolvedDrivers: string[];
  warnings: string[];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministically scaffold an artifact: allocate the next id, render the
 * canonical template, wire driver wikilinks, write the file, and backlink the
 * arc42 hub. Forward-references to not-yet-created drivers become placeholders.
 */
export async function scaffoldArtifact(
  input: ScaffoldInput,
  deps: ScaffoldDeps,
): Promise<ScaffoldResult> {
  const { spec } = input;
  const { repo, templates, clock } = deps;
  const warnings: string[] = [];

  // ITER files carry no slug; everything else needs one.
  const needsSlug = spec.kind !== 'iteration';
  const slug = needsSlug ? (input.slug?.trim() || requireSlug(input.title)) : '';

  let id: ArtifactId | null = null;
  if (spec.prefix) {
    id = nextId(spec, await repo.existingNumbers(spec));
  }

  const filename = spec.filename(id, slug);
  const relPath = `${spec.folder}/${filename}`;
  if (await repo.exists(relPath)) {
    throw new DomainError(`artifact already exists: ${relPath}`, 2);
  }

  // Resolve driver references to wikilinks (placeholders if not found).
  const wired: string[] = [];
  const unresolvedDrivers: string[] = [];
  const driverBullets: string[] = [];
  for (const d of input.drivers ?? []) {
    const base = await repo.resolveBasename(d);
    if (base) {
      driverBullets.push(`- [[${base}|${d}]]`);
      wired.push(d);
    } else {
      driverBullets.push(`- [[${d}]]`);
      unresolvedDrivers.push(d);
    }
  }
  const driversText = driverBullets.length ? driverBullets.join('\n') : '<!-- none yet -->';

  const template = await templates.load(spec);
  const { output, unresolved: tokens } = render(template, {
    id: id ? id.toString() : '',
    title: input.title,
    slug,
    date: isoDate(clock.now()),
    drivers: driversText,
  });
  if (tokens.length) warnings.push(`unresolved template tokens: ${tokens.join(', ')}`);
  if (unresolvedDrivers.length) {
    warnings.push(`unresolved drivers (placeholders): ${unresolvedDrivers.join(', ')}`);
  }

  if (input.dryRun) {
    return {
      id: id?.toString() ?? null,
      path: relPath,
      created: false,
      hubUpdated: false,
      wired,
      unresolvedDrivers,
      warnings,
    };
  }

  await repo.write(relPath, output);

  let hubUpdated = false;
  if (spec.hubFile) {
    const base = filename.replace(/\.md$/, '');
    const label = id ? `${id.toString()} · ${input.title}` : input.title;
    hubUpdated = await repo.appendHubLink(spec.hubFile, base, `- [[${base}|${label}]]`);
    if (!hubUpdated) warnings.push(`hub not found, skipped backlink: ${spec.hubFile}`);
  }

  return {
    id: id?.toString() ?? null,
    path: relPath,
    created: true,
    hubUpdated,
    wired,
    unresolvedDrivers,
    warnings,
  };
}
