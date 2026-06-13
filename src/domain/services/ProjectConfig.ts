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

  /**
   * OPTIONAL+default. The C4↔wiki consistency policy for `validate-c4`. Never
   * throws — validate-c4 works with sensible defaults even without a [c4] block
   * (the model arrives via --model-json, not from c4().dir). Default keeps the
   * check low-noise: only `system`+`container` elements must be documented.
   */
  c4Consistency(): {
    requireDocumentation: string[];
    severity: 'high' | 'medium' | 'low';
    ignore: string[];
  } {
    const c = this.cfg.c4?.consistency;
    return {
      requireDocumentation: c?.requireDocumentation ?? ['system', 'container'],
      severity: c?.severity ?? 'medium',
      ignore: c?.ignore ?? [],
    };
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

  /** OPTIONAL. The wiki language if declared, else null (informational for the mirror). */
  languageOrNull(): string | null {
    return this.cfg.tasks?.language ?? null;
  }

  /** OPTIONAL. Returns null; the CALLER fails fast when it actually needs Jira. */
  jira(): NonNullable<NonNullable<ProjectConfigFile['integrations']>['jira']> | null {
    return this.cfg.integrations?.jira ?? null;
  }

  /** OPTIONAL. Returns null; the CALLER fails fast when it actually needs Confluence (publish). */
  confluence(): NonNullable<NonNullable<ProjectConfigFile['integrations']>['confluence']> | null {
    return this.cfg.integrations?.confluence ?? null;
  }

  /**
   * OPTIONAL. The Atlassian site base URL for ABSOLUTE Confluence links in Jira issues
   * (issue→mirror trace). Null = build root-relative /wiki links instead (caller warns).
   * Trailing slash stripped so callers can append `/wiki/...` safely.
   */
  confluenceSiteUrl(): string | null {
    const u = this.cfg.integrations?.confluence?.siteUrl;
    return u ? u.replace(/\/+$/, '') : null;
  }

  /** REQUIRED-WHEN-USED. Throws exit 2 if absent — the PO User Story Log source (pull-stories). */
  userStoryLog(): NonNullable<
    NonNullable<NonNullable<ProjectConfigFile['integrations']>['upstream']>['userStoryLog']
  > {
    const u = this.cfg.integrations?.upstream?.userStoryLog;
    if (!u) {
      throw new DomainError(
        'project has no [integrations.upstream.userStoryLog]; required by pull-stories',
        2,
      );
    }
    return u;
  }
}
