import { BooksRagPlanner } from '../../src/adapters/rag/BooksRagPlanner';

const planner = new BooksRagPlanner();

describe('BooksRagPlanner.renderPlan', () => {
  it('pins corpus and tool in every plan (invariant 3)', () => {
    const plan = planner.renderPlan({ site: 'hypothesis', topic: 'Caching' });
    expect(plan.corpus).toBe('local-rag');
    expect(plan.mcpTool).toBe('mcp__local-rag__query_documents');
  });

  it('hypothesis → one query (limit 10), not optional, kind hints folded in', () => {
    const plan = planner.renderPlan({ site: 'hypothesis', topic: 'Caching', kindHints: ['quality-attribute'] });
    expect(plan.optional).toBe(false);
    expect(plan.queries).toHaveLength(1);
    expect(plan.queries[0]!.key).toBe('hypothesis:patterns');
    expect(plan.queries[0]!.limit).toBe(10);
    expect(plan.queries[0]!.query).toContain('Caching');
    expect(plan.queries[0]!.query).toContain('quality-attribute');
  });

  it('questionnaire-rozanski → one query per default viewpoint (limit 5), sorted by key', () => {
    const plan = planner.renderPlan({ site: 'questionnaire-rozanski', topic: 'Payments' });
    expect(plan.optional).toBe(false);
    expect(plan.queries).toHaveLength(6);
    expect(plan.queries.every((q) => q.limit === 5)).toBe(true);
    const keys = plan.queries.map((q) => q.key);
    expect(keys).toEqual([...keys].sort());
    expect(keys).toContain('questionnaire:viewpoint:functional');
  });

  it('questionnaire-rozanski honours an explicit viewpoint list', () => {
    const plan = planner.renderPlan({ site: 'questionnaire-rozanski', topic: 'X', viewpoints: ['security'] });
    expect(plan.queries).toHaveLength(1);
    expect(plan.queries[0]!.key).toBe('questionnaire:viewpoint:security');
  });

  it('enrich → one optional query per driver keyed enrich:<id>', () => {
    const plan = planner.renderPlan({ site: 'enrich', drivers: ['QA-007', 'UC-001'] });
    expect(plan.optional).toBe(true);
    expect(plan.queries.map((q) => q.key)).toEqual(['enrich:QA-007', 'enrich:UC-001']);
    expect(plan.queries.every((q) => q.limit === 5)).toBe(true);
  });

  it('is deterministic for identical input', () => {
    const a = planner.renderPlan({ site: 'enrich', drivers: ['B', 'A'] });
    const b = planner.renderPlan({ site: 'enrich', drivers: ['B', 'A'] });
    expect(a).toEqual(b);
    expect(a.queries.map((q) => q.key)).toEqual(['enrich:A', 'enrich:B']); // sorted
  });
});
