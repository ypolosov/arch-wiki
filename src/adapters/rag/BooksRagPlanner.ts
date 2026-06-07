import { BooksQuery, BooksQueryInput, BooksQueryPlan, BooksRagPort } from '../../application/ports/BooksRagPort';

/** Default Rozanski/Woods viewpoints (project-config may override the list). */
const ROZANSKI_VIEWPOINTS = [
  'functional',
  'information',
  'concurrency',
  'development',
  'deployment',
  'operational',
];

/**
 * Deterministic books-rag query planner (§5.1). Pure string assembly — no network,
 * no node:*. The corpus/tool are pinned in the TYPE (`BooksQueryPlan`), so Core
 * cannot target another backend (invariant 3 / §5.4). renderPlan ALWAYS succeeds;
 * the `optional` flag tells the command whether graceful degradation is allowed.
 */
export class BooksRagPlanner implements BooksRagPort {
  renderPlan(input: BooksQueryInput): BooksQueryPlan {
    const queries = this.queriesFor(input).slice().sort((a, b) => a.key.localeCompare(b.key));
    return {
      corpus: 'local-rag',
      mcpTool: 'mcp__local-rag__query_documents',
      queries,
      optional: input.site === 'enrich',
    };
  }

  private queriesFor(input: BooksQueryInput): BooksQuery[] {
    switch (input.site) {
      case 'hypothesis': {
        const hints = (input.kindHints ?? []).filter(Boolean);
        const scope = hints.length ? ` (${hints.join(', ')})` : '';
        return [
          {
            key: 'hypothesis:patterns',
            query: `architecture patterns and tactics relevant to "${input.topic}"${scope}`,
            limit: 10,
            purpose: 'patterns to inform the hypothesis prose',
          },
        ];
      }
      case 'questionnaire-rozanski': {
        const viewpoints = (input.viewpoints?.length ? input.viewpoints : ROZANSKI_VIEWPOINTS).filter(Boolean);
        return viewpoints.map((v) => ({
          key: `questionnaire:viewpoint:${v}`,
          query: `${v} viewpoint concerns and example questions for "${input.topic}"`,
          limit: 5,
          purpose: `Rozanski/Woods ${v} viewpoint examples`,
        }));
      }
      case 'enrich': {
        return input.drivers.filter(Boolean).map((d) => ({
          key: `enrich:${d}`,
          query: `architecture patterns related to ${d}`,
          limit: 5,
          purpose: `Related Patterns enrichment for ${d}`,
        }));
      }
    }
  }
}
