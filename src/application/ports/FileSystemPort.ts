/** Driven port for filesystem access. Keeps the core free of node:fs. */
export interface FileSystemPort {
  exists(absPath: string): Promise<boolean>;
  readFile(absPath: string): Promise<string>;
  /** Writes the file, creating parent directories as needed. */
  writeFile(absPath: string, content: string): Promise<void>;
  /** Directory entry names, or [] if the directory is missing. */
  list(absDir: string): Promise<string[]>;
}
