import { Migration } from '../types';

const CONFIG = '.arch-wiki/config.json';

// Behavior-preserving seed: every block omitted ⇒ ProjectConfig falls back to
// ARTIFACT_SPECS / agnostic defaults, so scaffold/lint/migrate stay byte-identical
// until the maintainer fills the profile. Its PRESENCE marks "adopted to schema v2".
const STUB = `${JSON.stringify(
  {
    _doc:
      'arch-wiki project profile, read deterministically by the CLI. Human contract: ../CLAUDE.md. ' +
      'Fill c4 / tasks / requiredSections / integrations to override; absence = agnostic defaults.',
  },
  null,
  2,
)}\n`;

/**
 * Introduce the `.arch-wiki/config.json` project profile. Mirrors migration 0001
 * exactly: writes ONLY under `.arch-wiki/`, returns a log, and does NOT write
 * version.json (applyMigration writes the marker after up() returns). Idempotent.
 */
export const migration0002: Migration = {
  from: 1,
  to: 2,
  description: 'introduce .arch-wiki/config.json project profile (empty behavior-preserving stub)',
  async up(ctx) {
    const log: string[] = [];
    const p = ctx.abs(CONFIG);
    if (await ctx.fs.exists(p)) {
      log.push('config.json already present, skipped');
      return log;
    }
    await ctx.fs.writeFile(p, STUB);
    log.push('seeded empty project profile (.arch-wiki/config.json); fill it to override agnostic defaults');
    return log;
  },
};
