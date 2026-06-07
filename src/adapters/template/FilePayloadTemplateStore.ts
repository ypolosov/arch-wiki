import * as path from 'node:path';
import { PayloadTemplatePort } from '../../application/ports/PayloadTemplatePort';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import { DomainError } from '../../domain/errors';

/** Loads named payload templates from the plugin's `templates/payloads/` directory. */
export class FilePayloadTemplateStore implements PayloadTemplatePort {
  constructor(
    private readonly dir: string,
    private readonly fs: FileSystemPort,
  ) {}

  async loadByName(name: string): Promise<string> {
    const p = path.join(this.dir, name);
    if (!(await this.fs.exists(p))) {
      throw new DomainError(`payload template not found: ${name} (looked in ${this.dir})`, 3);
    }
    return this.fs.readFile(p);
  }
}
