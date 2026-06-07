import { FileSystemPort } from '../application/ports/FileSystemPort';
import { LintFinding } from '../domain/services/LintRuleSet';

/** Services a migration's `up()` may use. Keeps migrations testable. */
export interface MigrationContext {
  /** Resolve a wiki-relative posix path to absolute. */
  abs(relPath: string): string;
  fs: FileSystemPort;
  /** Current deterministic lint findings (for baselining). */
  lint(): Promise<LintFinding[]>;
  /** Stable content hash (e.g. sha256 hex). */
  hash(content: string): string;
  now(): Date;
}

export interface Migration {
  /** Schema version this migration upgrades from. */
  from: number;
  /** Schema version this migration upgrades to (must be from + 1). */
  to: number;
  description: string;
  /** Idempotent forward transform; returns a human-readable action log. */
  up(ctx: MigrationContext): Promise<string[]>;
}
