import { ProjectConfig } from '../../src/domain/services/ProjectConfig';
import { ProjectConfigSchema } from '../../src/domain/model/ProjectConfigSchema';
import { ARTIFACT_SPECS } from '../../src/domain/model/ArtifactType';

const cfg = (raw: unknown) => ProjectConfig.from(ProjectConfigSchema.parse(raw));

describe('ProjectConfig (pure)', () => {
  it('from(null) yields agnostic defaults (no throw)', () => {
    const c = ProjectConfig.from(null);
    expect(c.hubFile('adr')).toBe(ARTIFACT_SPECS['adr'].hubFile);
    expect(c.requiredSections('quality-attribute')).toEqual([]);
    expect(c.notificationTarget()).toEqual({ channel: 'none' });
    expect(c.jira()).toBeNull();
  });

  it('arc42Map overrides hubFile per kind; other kinds fall back to ARTIFACT_SPECS', () => {
    const c = cfg({ arc42Map: { adr: 'arc42/custom-decisions.md' } });
    expect(c.hubFile('adr')).toBe('arc42/custom-decisions.md');
    expect(c.hubFile('use-case')).toBe(ARTIFACT_SPECS['use-case'].hubFile);
  });

  it('required-when-used accessors throw exit 2 when absent — no guess', () => {
    const c = ProjectConfig.from(null);
    for (const fn of [() => c.c4(), () => c.taskPrefix('arch'), () => c.language()]) {
      expect(fn).toThrow();
      try {
        fn();
      } catch (e) {
        expect((e as { exitCode: number }).exitCode).toBe(2);
      }
    }
  });

  it('resolves prefixes, role prefixes and language from config', () => {
    const c = cfg({
      tasks: {
        language: 'ru',
        prefixes: { arch: '[Arch]', techdesign: '[Techdesign]' },
        rolePrefixes: { be: '[BE] [Techdesign]' },
      },
    });
    expect(c.language()).toBe('ru');
    expect(c.taskPrefix('arch')).toBe('[Arch]');
    expect(c.taskPrefix('techdesign', 'be')).toBe('[BE] [Techdesign]');
    expect(() => c.taskPrefix('techdesign', 'qa')).toThrow(); // unknown role
  });

  it('returns required sections (with zod defaults) and notification target', () => {
    const c = cfg({
      requiredSections: { 'quality-attribute': [{ marker: 'C4 elements', minWikilinks: 1, severity: 'high' }] },
      integrations: { notifications: { channel: 'discord', channelId: 'X' } },
    });
    expect(c.requiredSections('quality-attribute')).toEqual([
      { marker: 'C4 elements', minWikilinks: 1, severity: 'high' },
    ]);
    expect(c.requiredSections('adr')).toEqual([]);
    expect(c.notificationTarget()).toEqual({ channel: 'discord', channelId: 'X' });
  });

  it('c4() returns commands when present', () => {
    const c = cfg({ c4: { dir: 'c4', validate: 'npm run validate' } });
    expect(c.c4().validate).toBe('npm run validate');
  });

  it('confluenceSiteUrl(): null when absent; trailing slash trimmed when set', () => {
    expect(ProjectConfig.from(null).confluenceSiteUrl()).toBeNull();
    expect(cfg({ integrations: { confluence: { space: 'PP' } } }).confluenceSiteUrl()).toBeNull();
    expect(
      cfg({ integrations: { confluence: { space: 'PP', siteUrl: 'https://acme.atlassian.net/' } } }).confluenceSiteUrl(),
    ).toBe('https://acme.atlassian.net');
  });

  it('confluenceSpaceId()/confluenceCloudId(): numeric id + cloudId, null when absent (v0.8)', () => {
    expect(ProjectConfig.from(null).confluenceSpaceId()).toBeNull();
    expect(ProjectConfig.from(null).confluenceCloudId()).toBeNull();
    const c = cfg({ integrations: { confluence: { space: 'PP', spaceId: '163845', cloudId: 'cloud-1' } } });
    expect(c.confluenceSpaceId()).toBe('163845');
    expect(c.confluenceCloudId()).toBe('cloud-1');
  });

  it('jiraSiteUrl(): prefers jira.siteUrl, falls back to confluence.siteUrl, null when neither (v0.8)', () => {
    expect(ProjectConfig.from(null).jiraSiteUrl()).toBeNull();
    expect(
      cfg({ integrations: { confluence: { space: 'PP', siteUrl: 'https://acme.atlassian.net' } } }).jiraSiteUrl(),
    ).toBe('https://acme.atlassian.net'); // fallback to confluence host
    expect(
      cfg({
        integrations: {
          jira: { siteUrl: 'https://jira.acme.net/' },
          confluence: { space: 'PP', siteUrl: 'https://acme.atlassian.net' },
        },
      }).jiraSiteUrl(),
    ).toBe('https://jira.acme.net'); // jira.siteUrl wins, trailing slash trimmed
  });
});
