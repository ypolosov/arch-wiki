import * as path from 'node:path';
import { ProjectConfigPort } from '../../application/ports/ProjectConfigPort';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import { ProjectConfigFile, ProjectConfigSchema } from '../../domain/model/ProjectConfigSchema';
import { DomainError } from '../../domain/errors';

/**
 * Reads `<root>/.arch-wiki/config.json`. The ONLY place that throws on a bad
 * config: malformed JSON or an invalid schema → DomainError exit 2 (a config is
 * a semantic contract, validate-not-guess). Only ABSENCE is graceful (→ null),
 * which is the domain-correct "use agnostic defaults" state (plan §2.4).
 */
export class FileProjectConfigStore implements ProjectConfigPort {
  constructor(
    private readonly root: string,
    private readonly fs: FileSystemPort,
  ) {}

  private file(): string {
    return path.join(this.root, '.arch-wiki', 'config.json');
  }

  async read(): Promise<ProjectConfigFile | null> {
    const f = this.file();
    if (!(await this.fs.exists(f))) return null; // absent ⇒ null (NOT throw)
    let raw: unknown;
    try {
      raw = JSON.parse(await this.fs.readFile(f));
    } catch (e) {
      throw new DomainError(`malformed config.json: ${(e as Error).message}`, 2);
    }
    const r = ProjectConfigSchema.safeParse(raw);
    if (!r.success) {
      throw new DomainError(
        `invalid config.json: ${r.error.issues
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join('; ')}`,
        2,
      );
    }
    return r.data;
  }
}
