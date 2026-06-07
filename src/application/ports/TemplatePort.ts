import { ArtifactSpec } from '../../domain/model/ArtifactType';

/** A plugin-owned template file: its name (e.g. `adr.md`) and raw body. */
export interface TemplateFile {
  name: string;
  body: string;
}

/** Driven port for loading the canonical (plugin-owned) templates. */
export interface TemplatePort {
  load(spec: ArtifactSpec): Promise<string>;
  /** Every shipped template (top-level `*.md`), sorted by name. */
  listAll(): Promise<TemplateFile[]>;
}
