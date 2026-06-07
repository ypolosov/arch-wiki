import { ClockPort } from '../../application/ports/ClockPort';

/**
 * Real clock. Honours `ARCH_WIKI_NOW` (ISO string) so output dates are
 * reproducible in tests and golden e2e runs.
 */
export class SystemClock implements ClockPort {
  now(): Date {
    const override = process.env.ARCH_WIKI_NOW;
    return override ? new Date(override) : new Date();
  }
}
