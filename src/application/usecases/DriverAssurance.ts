import { buildGraph } from '../../domain/model/Graph';
import {
  AssuranceSummary,
  DriverAssurance,
  computeAssurance,
  summarizeAssurance,
} from '../../domain/services/Assurance';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface DriverAssuranceDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
}

export interface DriverAssuranceReport {
  drivers: DriverAssurance[];
  summary: AssuranceSummary;
}

/**
 * Deterministically compute the AssuranceLevel of every driver (FPF B.3.3), loading
 * the graph + issue ledger. Read-only; the LLM only narrates the levels.
 */
export async function reportDriverAssurance(
  deps: DriverAssuranceDeps,
): Promise<DriverAssuranceReport> {
  const [pages, issues] = await Promise.all([deps.repo.loadPages(), deps.ledger.readIssues()]);
  const g = buildGraph(pages);
  const drivers = computeAssurance(g, { ledgerIssueKeys: new Set(issues.map((r) => r.key)) });
  return { drivers, summary: summarizeAssurance(drivers) };
}
