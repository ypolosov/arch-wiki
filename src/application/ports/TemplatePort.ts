import { ArtifactSpec } from '../../domain/model/ArtifactType';

/** Driven port for loading the canonical (plugin-owned) template for a kind. */
export interface TemplatePort {
  load(spec: ArtifactSpec): Promise<string>;
}
