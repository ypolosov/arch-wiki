/** Driven port for the current time, so output dates are testable/reproducible. */
export interface ClockPort {
  now(): Date;
}
