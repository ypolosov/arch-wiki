export interface VersionMarker {
  /** Monotonic integer version of the on-disk contract. */
  schemaVersion: number;
  /** Plugin semver that last migrated this target. */
  pluginVersion: string;
  /** ISO timestamp of the last migration, or null. */
  lastMigratedAt: string | null;
}

/** Driven port for the target's schema-version marker (git-stored). */
export interface VersionStorePort {
  read(): Promise<VersionMarker | null>;
  write(marker: VersionMarker): Promise<void>;
}
