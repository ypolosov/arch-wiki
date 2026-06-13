import { z } from 'zod';

/**
 * Schema for the target's project profile (`docs/architecture/.arch-wiki/config.json`).
 * Every block is optional at the file level (a greenfield wiki may omit the file
 * entirely); per-function required-ness is enforced at the point of use in
 * `ProjectConfig` (fail-fast, see plan §2.4). `.strict()` everywhere so a typo'd
 * key fails loudly instead of being silently ignored.
 */

const ArtifactKindEnum = z.enum([
  'use-case',
  'quality-attribute',
  'constraint',
  'concern',
  'adr',
  'iteration',
  'entity',
  'concept',
  'arc42',
]);

// 1. arc42 hub-file map — overrides ARTIFACT_SPECS[kind].hubFile per kind (partial).
const Arc42MapSchema = z.record(ArtifactKindEnum, z.string().min(1)).optional();

// 2. C4 npm commands — required-when-used (cartographer / validate-graph C4 step).
// `consistency` (OPTIONAL+default) tunes the deterministic C4↔wiki drift check
// (validate-c4): which element kinds must be documented, finding severity, and
// suppressions. Defaults keep it low-noise (system+container only) — see §12.10.
const C4ConsistencySchema = z
  .object({
    requireDocumentation: z.array(z.string().min(1)).optional(),
    severity: z.enum(['high', 'medium', 'low']).optional(),
    ignore: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .optional();

const C4Schema = z
  .object({
    dir: z.string().min(1),
    validate: z.string().min(1),
    build: z.string().min(1).optional(),
    export: z.string().min(1).optional(),
    consistency: C4ConsistencySchema,
  })
  .strict()
  .optional();

// 3. Task prefixes + language — required-when-used (render-issue). No [Arch]/RU in code (§1.2).
const TaskKindEnum = z.enum(['arch', 'techdesign']);
const TasksSchema = z
  .object({
    language: z.string().min(2),
    prefixes: z.record(TaskKindEnum, z.string().min(1)),
    rolePrefixes: z.record(z.string().min(1), z.string().min(1)).optional(),
  })
  .strict()
  .optional();

// 4. Required-sections-per-kind — the structural lint contract.
const RequiredSectionSchema = z
  .object({
    marker: z.string().min(1),
    minWikilinks: z.number().int().min(0).default(0),
    severity: z.enum(['high', 'medium', 'low']).default('medium'),
  })
  .strict();
const RequiredSectionsSchema = z.record(ArtifactKindEnum, z.array(RequiredSectionSchema)).optional();

// 5. Integrations — optional; absence = domain-correct "no integration". NEVER secrets.
// `upstream.userStoryLog` (CAP-1) is the read-only Product-Owner Confluence source of
// functional rules; `pull-stories` snapshots it into raw/_synced/. cloudId/pageId are
// target-specific (agnostic — never hardcoded in code).
const UpstreamSchema = z
  .object({
    userStoryLog: z
      .object({
        cloudId: z.string().min(1),
        pageId: z.string().min(1),
        childTitlePrefix: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .optional();

const IntegrationsSchema = z
  .object({
    jira: z.object({ board: z.string(), projectKey: z.string() }).partial().strict().optional(),
    confluence: z
      .object({
        space: z.string(),
        cloudId: z.string(),
        // CAP-2 (v0.7): the Atlassian site base URL (e.g. https://acme.atlassian.net).
        // Used to build ABSOLUTE Confluence links inside Jira issues (issue→mirror trace,
        // render-issue) — Jira ADF wants an absolute href; cloudId is a UUID, not the host.
        // Absent → render-issue emits root-relative /wiki links (work from Jira on the same
        // site, but absolute is preferred). The in-Confluence mirror itself stays root-relative.
        siteUrl: z.string().url(),
        // CAP-2 RU projection (v0.6, plan §13): when `language` is set the mirror is a
        // translated PRESENTATION projection (canon stays English in Layer-2). Absent →
        // publish English as-is (backward-compatible). `preserveTerms` is a denylist of
        // terms the translation must keep verbatim (Core also merges glossary.md bold terms).
        language: z.string().min(2),
        preserveTerms: z.array(z.string().min(1)),
        // CAP-2 visibility filter: ADR statuses + register basenames hidden from the
        // stakeholder mirror (per-page frontmatter `confluence`/`audience` overrides).
        exclude: z
          .object({
            statuses: z.array(z.string().min(1)).optional(),
            basenames: z.array(z.string().min(1)).optional(),
          })
          .strict()
          .optional(),
      })
      .partial()
      .strict()
      .optional(),
    upstream: UpstreamSchema,
    notifications: z
      .object({
        channel: z.enum(['discord', 'slack', 'none']).default('none'),
        channelId: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .optional();

export const ProjectConfigSchema = z
  .object({
    $schema: z.string().optional(),
    _doc: z.string().optional(), // human note; Core ignores it
    arc42Map: Arc42MapSchema,
    c4: C4Schema,
    tasks: TasksSchema,
    requiredSections: RequiredSectionsSchema,
    integrations: IntegrationsSchema,
  })
  .strict();

export type ProjectConfigFile = z.infer<typeof ProjectConfigSchema>;
export type RequiredSection = z.infer<typeof RequiredSectionSchema>;
