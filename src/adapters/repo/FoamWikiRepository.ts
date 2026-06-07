import * as path from 'node:path';
import matter from 'gray-matter';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import { WikiRepositoryPort } from '../../application/ports/WikiRepositoryPort';
import { ArtifactId } from '../../domain/model/ArtifactId';
import { ARTIFACT_SPECS, ArtifactSpec, ArtifactKind } from '../../domain/model/ArtifactType';
import { WikiPage } from '../../domain/model/WikiPage';
import { scanPage } from '../../domain/services/WikilinkScanner';

// Top-level folders never treated as Layer-2 wiki pages.
const EXCLUDED_TOP = new Set(['raw', 'c4', '.foam', '.arch-wiki', 'out', 'node_modules', '.git']);

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

  async readLintBaseline(): Promise<string[]> {
    const f = this.abs('.arch-wiki/lint-baseline.json');
    if (!(await this.fs.exists(f))) return [];
    try {
      const parsed = JSON.parse(await this.fs.readFile(f));
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  async listFiles(): Promise<string[]> {
    const files = await this.fs.walk(this.root);
    return files
      .map((abs) => path.relative(this.root, abs).split(path.sep).join('/'))
      .filter((rel) => !rel.startsWith('.git/') && !rel.startsWith('node_modules/'));
  }

  async loadPages(): Promise<WikiPage[]> {
    const files = await this.fs.walk(this.root);
    const pages: WikiPage[] = [];
    for (const absFile of files) {
      if (!absFile.endsWith('.md')) continue;
      const rel = path.relative(this.root, absFile).split(path.sep).join('/');
      const top = rel.split('/')[0]!;
      if (EXCLUDED_TOP.has(top)) continue;
      const raw = await this.fs.readFile(absFile);
      const parsed = matter(raw);
      const { links, mdLinks, headings, labels, sectionWikilinkCounts } = scanPage(parsed.content);
      const dir = path.posix.dirname(rel);
      pages.push({
        relPath: rel,
        basename: path.basename(rel, '.md'),
        folder: dir === '.' ? '' : dir,
        frontmatter: (parsed.data ?? {}) as Record<string, unknown>,
        links,
        mdLinks,
        headings,
        labels,
        sectionWikilinkCounts,
      });
    }
    return pages;
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
