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
const C4Schema = z
  .object({
    dir: z.string().min(1),
    validate: z.string().min(1),
    build: z.string().min(1).optional(),
    export: z.string().min(1).optional(),
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
const IntegrationsSchema = z
  .object({
    jira: z.object({ board: z.string(), projectKey: z.string() }).partial().strict().optional(),
    confluence: z.object({ space: z.string() }).partial().strict().optional(),
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
