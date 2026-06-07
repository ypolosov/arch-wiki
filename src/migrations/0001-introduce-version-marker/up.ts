import { Migration } from '../types';
import { baselineKey } from '../../domain/services/LintRuleSet';

const TEMPLATES_DIR = '.foam/templates';

/**
 * Adopt an existing (possibly populated) wiki onto the deterministic contract:
 * snapshot the target's curated Foam templates (so a later non-destructive
 * sync-templates won't clobber them) and record a lint baseline (so the new
 * deterministic lint doesn't drown the user in pre-existing findings). The
 * engine writes version.json after this returns. Idempotent.
 */
export const migration0001: Migration = {
  from: 0,
  to: 1,
  description: 'introduce .arch-wiki marker; snapshot templates + lint baseline (adopt existing wiki)',
  async up(ctx) {
    const log: string[] = [];

    const snapshot: Record<string, string> = {};
    for (const name of (await ctx.fs.list(ctx.abs(TEMPLATES_DIR))).sort()) {
      if (!name.endsWith('.md')) continue;
      const content = await ctx.fs.readFile(ctx.abs(`${TEMPLATES_DIR}/${name}`));
      snapshot[name] = ctx.hash(content);
    }
    await ctx.fs.writeFile(
      ctx.abs('.arch-wiki/template-snapshot.json'),
      `${JSON.stringify(snapshot, null, 2)}\n`,
    );
    log.push(`snapshotted ${Object.keys(snapshot).length} curated template(s)`);

    // Same key the runtime lint suppresses on (marker-independent for
    // required-section rules) so baselined findings stay suppressed (plan §3.8).
    const baseline = (await ctx.lint()).map(baselineKey).sort();
    await ctx.fs.writeFile(
      ctx.abs('.arch-wiki/lint-baseline.json'),
      `${JSON.stringify(baseline, null, 2)}\n`,
    );
    log.push(`recorded lint baseline: ${baseline.length} pre-existing finding(s)`);

    return log;
  },
};
