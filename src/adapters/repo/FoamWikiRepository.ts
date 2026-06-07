import * as path from 'node:path';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import { WikiRepositoryPort } from '../../application/ports/WikiRepositoryPort';
import { ArtifactId } from '../../domain/model/ArtifactId';
import { ARTIFACT_SPECS, ArtifactSpec, ArtifactKind } from '../../domain/model/ArtifactType';

// Prefix → spec, for resolving an id back to its folder/file.
const PREFIX_TO_SPEC: Record<string, ArtifactSpec> = {};
for (const kind of Object.keys(ARTIFACT_SPECS) as ArtifactKind[]) {
  const spec = ARTIFACT_SPECS[kind];
  if (spec.prefix) PREFIX_TO_SPEC[spec.prefix] = spec;
}

/** WikiRepositoryPort over a target's `docs/architecture/` via a FileSystemPort. */
export class FoamWikiRepository implements WikiRepositoryPort {
  constructor(
    private readonly root: string,
    private readonly fs: FileSystemPort,
  ) {}

  private abs(relPath: string): string {
    return path.join(this.root, relPath);
  }

  private numberFromFilename(spec: ArtifactSpec, filename: string): number | null {
    if (!filename.endsWith('.md')) return null;
    if (spec.kind === 'adr') {
      const m = /^(\d+)-/.exec(filename);
      return m ? Number(m[1]) : null;
    }
    if (spec.prefix) {
      // `QA-003-....md` or `ITER-04.md`
      const m = new RegExp(`^${spec.prefix}-(\\d+)`).exec(filename);
      return m ? Number(m[1]) : null;
    }
    return null;
  }

  async existingNumbers(spec: ArtifactSpec): Promise<number[]> {
    const files = await this.fs.list(this.abs(spec.folder));
    const nums: number[] = [];
    for (const f of files) {
      const n = this.numberFromFilename(spec, f);
      if (n != null) nums.push(n);
    }
    return nums;
  }

  async resolveBasename(idText: string): Promise<string | null> {
    const id = ArtifactId.parse(idText);
    if (!id) return null;
    const spec = PREFIX_TO_SPEC[id.prefix];
    if (!spec) return null;
    const files = await this.fs.list(this.abs(spec.folder));
    const prefixMatch =
      spec.kind === 'adr' ? `${id.padded}-` : `${id.prefix}-${id.padded}`;
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const isExact = f === `${prefixMatch}.md`; // e.g. ITER-04.md
      if (f.startsWith(prefixMatch) || isExact) return f.replace(/\.md$/, '');
    }
    return null;
  }

  async exists(relPath: string): Promise<boolean> {
    return this.fs.exists(this.abs(relPath));
  }

  async write(relPath: string, content: string): Promise<void> {
    await this.fs.writeFile(this.abs(relPath), content);
  }

  async read(relPath: string): Promise<string> {
    return this.fs.readFile(this.abs(relPath));
  }

  async appendHubLink(hubRelPath: string, basename: string, bullet: string): Promise<boolean> {
    const abs = this.abs(hubRelPath);
    if (!(await this.fs.exists(abs))) return false;
    const content = await this.fs.readFile(abs);
    if (content.includes(`[[${basename}`)) return true; // already linked → idempotent
    const sep = content.length === 0 || content.endsWith('\n') ? '' : '\n';
    await this.fs.writeFile(abs, `${content}${sep}${bullet}\n`);
    return true;
  }
}
