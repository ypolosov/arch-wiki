import * as path from 'node:path';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import { VersionStorePort, VersionMarker } from '../../application/ports/VersionStorePort';

/** Stores the version marker at `<root>/.arch-wiki/version.json`. */
export class FileVersionStore implements VersionStorePort {
  constructor(
    private readonly root: string,
    private readonly fs: FileSystemPort,
  ) {}

  private file(): string {
    return path.join(this.root, '.arch-wiki', 'version.json');
  }

  async read(): Promise<VersionMarker | null> {
    const f = this.file();
    if (!(await this.fs.exists(f))) return null;
    return JSON.parse(await this.fs.readFile(f)) as VersionMarker;
  }

  async write(marker: VersionMarker): Promise<void> {
    await this.fs.writeFile(this.file(), `${JSON.stringify(marker, null, 2)}\n`);
  }
}
