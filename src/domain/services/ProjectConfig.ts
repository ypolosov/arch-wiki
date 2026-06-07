import { ARTIFACT_SPECS, ArtifactKind } from '../model/ArtifactType';
import { ProjectConfigFile, RequiredSection } from '../model/ProjectConfigSchema';
import { DomainError } from '../errors';

export interface NotificationTarget {
  channel: 'discord' | 'slack' | 'none';
  channelId?: string;
}

/**
 * Pure, deterministic view over the target's project profile. Built from an
 * already-parsed config (or null → agnostic defaults). Optional settings fall
 * back to ARTIFACT_SPECS / domain-correct empties; required-when-used settings
 * (c4, tasks) throw at the accessor (fail-fast, plan §2.4) rather than guess.
 * Imports only ARTIFACT_SPECS + DomainError — no I/O, no node:*.
 */
export class ProjectConfig {
  private constructor(private readonly cfg: ProjectConfigFile) {}

  static from(file: ProjectConfigFile | null): ProjectConfig {
    return new ProjectConfig(file ?? {});
  }

  /** OPTIONAL+default. Never throws (override ?? ARTIFACT_SPECS). */
  hubFile(kind: ArtifactKind): string | null {
    return this.cfg.arc42Map?.[kind] ?? ARTIFACT_SPECS[kind].hubFile;
  }

  /** OPTIONAL. Never throws (?? []). */
  requiredSections(kind: ArtifactKind): RequiredSection[] {
    return this.cfg.requiredSections?.[kind] ?? [];
  }

  /** OPTIONAL. Never throws (?? {channel:'none'}). */
  notificationTarget(): NotificationTarget {
    return this.cfg.integrations?.notifications ?? { channel: 'none' };
  }

  /** REQUIRED-WHEN-USED. Throws exit 2 if absent (no guess). */
  c4(): NonNullable<ProjectConfigFile['c4']> {
    if (!this.cfg.c4) {
      throw new DomainError(
        'project has no [c4] config; required by cartographer/validate-graph C4 step',
        2,
      );
    }
    return this.cfg.c4;
  }

  /** REQUIRED-WHEN-USED. Throws exit 2 if absent (no guess). */
  taskPrefix(kind: 'arch' | 'techdesign', role?: string): string {
    const t = this.cfg.tasks;
    if (!t) throw new DomainError('project has no [tasks] config; required by render-issue', 2);
    if (kind === 'techdesign' && role) {
      const rp = t.rolePrefixes?.[role];
      if (!rp) throw new DomainError(`no task prefix for role "${role}"`, 2);
      return rp;
    }
    const p = t.prefixes?.[kind];
    if (!p) throw new DomainError(`no task prefix for "${kind}"`, 2);
    return p;
  }

  /** REQUIRED-WHEN-USED. Throws exit 2 if absent — no RU default in code (§1.2). */
  language(): string {
    const l = this.cfg.tasks?.language;
    if (!l) throw new DomainError('project has no [tasks.language]; required by render-issue', 2);
    return l;
  }

  /** OPTIONAL. Returns null; the CALLER fails fast when it actually needs Jira. */
  jira(): NonNullable<NonNullable<ProjectConfigFile['integrations']>['jira']> | null {
    return this.cfg.integrations?.jira ?? null;
  }
}
