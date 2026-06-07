import { DomainError } from '../errors';

const ID_RE = /^([A-Z]+)-(\d+)$/;

/**
 * Value object for a numbered artifact id, e.g. `QA-007`, `ADR-0023`, `ITER-04`.
 * Pure and immutable; carries the zero-pad width so it formats deterministically.
 */
export class ArtifactId {
  constructor(
    readonly prefix: string,
    readonly num: number,
    readonly pad: number,
  ) {
    if (!/^[A-Z]+$/.test(prefix)) throw new DomainError(`invalid id prefix: "${prefix}"`);
    if (!Number.isInteger(num) || num < 0) throw new DomainError(`invalid id number: ${num}`);
    if (!Number.isInteger(pad) || pad < 1) throw new DomainError(`invalid id pad: ${pad}`);
  }

  /** The zero-padded number, e.g. `007`. */
  get padded(): string {
    return String(this.num).padStart(this.pad, '0');
  }

  /** The full id, e.g. `QA-007`. */
  toString(): string {
    return `${this.prefix}-${this.padded}`;
  }

  /** Parse `QA-007` → ArtifactId(QA, 7, 3). Returns null if it does not match. */
  static parse(value: string): ArtifactId | null {
    const m = ID_RE.exec(value.trim());
    if (!m) return null;
    const prefix = m[1]!;
    const digits = m[2]!;
    return new ArtifactId(prefix, Number(digits), digits.length);
  }
}
