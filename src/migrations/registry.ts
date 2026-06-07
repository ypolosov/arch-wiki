import { Migration } from './types';
import { migration0001 } from './0001-introduce-version-marker/up';

/** The schema version the current plugin expects on disk. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Ordered, contiguous migration chain (from 0 upward). */
export const MIGRATIONS: Migration[] = [migration0001];
