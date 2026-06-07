import { ArtifactSpec } from '../../domain/model/ArtifactType';
import { WikiPage } from '../../domain/model/WikiPage';

/**
 * Driven port over a target's `docs/architecture/` wiki. All paths are relative
 * to the wiki root.
 */
export interface WikiRepositoryPort {
  /** Load all Layer-2 wiki pages (excludes raw/, c4/, .foam/, .arch-wiki/). */
  loadPages(): Promise<WikiPage[]>;
  /** All file relpaths under the wiki root (incl. raw/), for md-link resolution. */
  listFiles(): Promise<string[]>;
  /** Lint-baseline finding keys recorded at adoption (`[]` if none). */
  readLintBaseline(): Promise<string[]>;
  /** Existing artifact numbers for a numbered kind (scans its folder). */
  existingNumbers(spec: ArtifactSpec): Promise<number[]>;
  /** Basename (no `.md`) of the file for an id, scanning known folders; null if absent. */
  resolveBasename(idText: string): Promise<string | null>;
  exists(relPath: string): Promise<boolean>;
  write(relPath: string, content: string): Promise<void>;
  read(relPath: string): Promise<string>;
  /**
   * Append a wikilink bullet to a hub file. Idempotent (skips if `basename` is
   * already linked). Returns false if the hub file does not exist.
   */
  appendHubLink(hubRelPath: string, basename: string, bullet: string): Promise<boolean>;
}
