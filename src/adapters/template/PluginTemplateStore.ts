import * as path from 'node:path';
import { TemplatePort } from '../../application/ports/TemplatePort';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import { ArtifactSpec } from '../../domain/model/ArtifactType';
import { DomainError } from '../../domain/errors';

/** Loads canonical templates shipped in the plugin's `templates/` directory. */
export class PluginTemplateStore implements TemplatePort {
  constructor(
    private readonly dir: string,
    private readonly fs: FileSystemPort,
  ) {}

  async load(spec: ArtifactSpec): Promise<string> {
    const p = path.join(this.dir, spec.template);
    if (!(await this.fs.exists(p))) {
      throw new DomainError(`template not found: ${spec.template} (looked in ${this.dir})`, 3);
    }
    return this.fs.readFile(p);
  }
}
