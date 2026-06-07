export interface BooksQuery {
  /** Stable id mapping a result back to its call-site (e.g. `enrich:QA-007`). */
  readonly key: string;
  /** Exact query string composed deterministically by Core. */
  readonly query: string;
  /** Hard cap on chunks (5 precise … 20 broad). */
  readonly limit: number;
  /** Human reason, rendered in command prose. */
  readonly purpose: string;
}

export interface BooksQueryPlan {
  /** Pins invariant 3 in the TYPE: Core cannot emit a plan for another backend. */
  readonly corpus: 'local-rag';
  readonly mcpTool: 'mcp__local-rag__query_documents';
  readonly queries: ReadonlyArray<BooksQuery>;
  /** true only for enrichment (degradation allowed). */
  readonly optional: boolean;
}

export type BooksQueryInput =
  | { site: 'hypothesis'; topic: string; kindHints?: string[] }
  | { site: 'questionnaire-rozanski'; topic: string; viewpoints?: string[] }
  | { site: 'enrich'; drivers: string[] };

/** Driven port that RENDERS a books-rag query plan deterministically — never executes it. */
export interface BooksRagPort {
  /** Deterministic. Pure string assembly; no network. */
  renderPlan(input: BooksQueryInput): BooksQueryPlan;
}

// Return seam (LLM → Core, for enrich), typed JSON (invariant 2).
export interface BooksHit {
  readonly source: string;
  readonly score: number;
  readonly excerpt: string;
}

export interface BooksAnswer {
  /** Matches a BooksQuery.key (e.g. `enrich:QA-007`). */
  readonly key: string;
  readonly hits: ReadonlyArray<BooksHit>;
}
