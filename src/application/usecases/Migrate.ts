import { DomainError } from '../../domain/errors';
import { Migration, MigrationContext } from '../../migrations/types';
import { CURRENT_SCHEMA_VERSION, MIGRATIONS } from '../../migrations/registry';
import { VersionStorePort } from '../ports/VersionStorePort';

/** Compute the contiguous chain current → target; throws on a gap. */
export function planMigration(
  current: number,
  target: number,
  registry: Migration[] = MIGRATIONS,
): Migration[] {
  if (target < current) {
    throw new DomainError(`cannot migrate down (schema v${current} → v${target})`, 1);
  }
  const chain: Migration[] = [];
  let at = current;
  while (at < target) {
    const next = registry.find((m) => m.from === at);
    if (!next) throw new DomainError(`no migration from schema v${at}`, 4);
    chain.push(next);
    at = next.to;
  }
  return chain;
}

export interface MigrateOptions {
  to?: number;
  dryRun?: boolean;
  pluginVersion: string;
}

export interface MigrateResult {
  from: number;
  to: number;
  pending: { from: number; to: number; description: string }[];
  applied: { to: number; description: string; log: string[] }[];
}

export async function applyMigration(
  store: VersionStorePort,
  ctx: MigrationContext,
  opts: MigrateOptions,
): Promise<MigrateResult> {
  const marker = await store.read();
  const current = marker?.schemaVersion ?? 0;
  const target = opts.to ?? CURRENT_SCHEMA_VERSION;
  const chain = planMigration(current, target);

  const pending = chain.map((m) => ({ from: m.from, to: m.to, description: m.description }));
  const applied: MigrateResult['applied'] = [];

  if (!opts.dryRun) {
    for (const m of chain) {
      const log = await m.up(ctx);
      await store.write({
        schemaVersion: m.to,
        pluginVersion: opts.pluginVersion,
        lastMigratedAt: ctx.now().toISOString(),
      });
      applied.push({ to: m.to, description: m.description, log });
    }
  }

  return { from: current, to: target, pending, applied };
}
