/**
 * Base error for deterministic-core failures. `exitCode` maps onto the CLI
 * exit-code contract: 1 usage, 2 validation, 3 IO/runtime, 4 schema-mismatch.
 */
export class DomainError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 2) {
    super(message);
    this.name = 'DomainError';
    this.exitCode = exitCode;
  }
}
