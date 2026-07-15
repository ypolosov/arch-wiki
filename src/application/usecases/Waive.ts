import { DomainError } from '../../domain/errors';
import { ClockPort } from '../ports/ClockPort';
import { DebtWaiverRow, LedgerStorePort } from '../ports/LedgerStorePort';

export interface WaiveDebtInput {
  /** Artifact basename whose epistemic debt is waived. */
  subject: string;
  reason: string;
  /** ISO date the waiver expires; omit for indefinite. */
  until?: string | null;
  by: string;
}

export interface WaiveDebtDeps {
  ledger: LedgerStorePort;
  clock: ClockPort;
}

export interface WaiveDebtResult {
  subject: string;
  /** false if an identical waiver already existed (idempotent). */
  recorded: boolean;
  until: string | null;
}

/**
 * Human-gated epistemic-debt waiver (FPF B.3.4 CC-ED.5): record an auditable decision to
 * suppress a subject's decay debt until a date. Idempotent by subject. Fail-fast on missing
 * required inputs or a malformed `--until` (no silent default).
 */
export async function waiveDebt(input: WaiveDebtInput, deps: WaiveDebtDeps): Promise<WaiveDebtResult> {
  const subject = input.subject?.trim();
  if (!subject) throw new DomainError('waive-debt: missing --subject', 1);
  if (!input.reason?.trim()) throw new DomainError('waive-debt: missing --reason', 1);
  if (!input.by?.trim()) throw new DomainError('waive-debt: missing --by', 1);
  const until = input.until ? input.until.trim() : null;
  if (until != null && Number.isNaN(Date.parse(until))) {
    throw new DomainError(`waive-debt: --until "${until}" is not a date`, 1);
  }
  const row: DebtWaiverRow = {
    subject,
    reason: input.reason.trim(),
    until,
    by: input.by.trim(),
    waivedAt: deps.clock.now().toISOString(),
  };
  const recorded = await deps.ledger.appendWaiver(row);
  return { subject, recorded, until };
}
