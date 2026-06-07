import { ProjectConfigFile } from '../../domain/model/ProjectConfigSchema';

/** Driven port for loading the target's project profile. */
export interface ProjectConfigPort {
  /** The raw config, or null if absent (domain-correct: agnostic defaults apply). */
  read(): Promise<ProjectConfigFile | null>;
}
