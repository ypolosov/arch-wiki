import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { FileSystemPort } from '../../application/ports/FileSystemPort';

export class NodeFileSystem implements FileSystemPort {
  async exists(absPath: string): Promise<boolean> {
    try {
      await fs.access(absPath);
      return true;
    } catch {
      return false;
    }
  }

  readFile(absPath: string): Promise<string> {
    return fs.readFile(absPath, 'utf8');
  }

  async writeFile(absPath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, content, 'utf8');
  }

  async remove(absPath: string): Promise<void> {
    await fs.rm(absPath, { force: true });
  }

  async list(absDir: string): Promise<string[]> {
    try {
      return await fs.readdir(absDir);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
  }

  async walk(absDir: string): Promise<string[]> {
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: string[] = [];
    for (const e of entries) {
      const full = path.join(absDir, e.name);
      if (e.isDirectory()) out.push(...(await this.walk(full)));
      else if (e.isFile()) out.push(full);
    }
    return out;
  }
}
