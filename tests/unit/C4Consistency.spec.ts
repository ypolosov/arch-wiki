import { buildGraph, GraphSnapshot } from '../../src/domain/model/Graph';
import { WikiPage } from '../../src/domain/model/WikiPage';
import {
  checkC4Consistency,
  C4Element,
  C4ConsistencyPolicy,
} from '../../src/domain/services/C4Consistency';

function entity(basename: string, c4?: unknown): WikiPage {
  return {
    relPath: `entities/${basename}.md`,
    basename,
    folder: 'entities',
    frontmatter: c4 !== undefined ? { type: 'entity', c4 } : { type: 'entity' },
    links: [],
    mdLinks: [],
    headings: [],
    labels: [],
    sectionWikilinkCounts: new Map(),
  };
}

function graph(...entities: WikiPage[]): GraphSnapshot {
  return buildGraph(entities);
}

const el = (id: string, kind: string, title?: string): C4Element => ({
  id,
  kind,
  title: title ?? id,
});

const POLICY: C4ConsistencyPolicy = {
  requireDocumentation: ['system', 'container'],
  severity: 'medium',
  ignore: [],
};

describe('checkC4Consistency (pure)', () => {
  it('matched element + entity (by name) yields no findings', () => {
    const model = { elements: [el('cloud.backend', 'container', 'Backend')] };
    const findings = checkC4Consistency(model, graph(entity('backend')), POLICY);
    expect(findings).toEqual([]);
  });

  it('flags a required-kind C4 element with no wiki entity (direction 1)', () => {
    const model = { elements: [el('cloud.db', 'container', 'Database')] };
    const findings = checkC4Consistency(model, graph(), POLICY);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe('c4-element-without-wiki-entity');
    expect(findings[0]!.message).toContain('"cloud.db"');
    expect(findings[0]!.severity).toBe('medium');
    expect(findings[0]!.file).toBeUndefined();
  });

  it('flags a wiki entity with no matching C4 element (direction 2)', () => {
    const findings = checkC4Consistency({ elements: [] }, graph(entity('orphan-thing')), POLICY);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe('wiki-entity-without-c4-element');
    expect(findings[0]!.file).toBe('entities/orphan-thing.md');
  });

  it('honors an explicit frontmatter c4: <id> mapping over name-matching', () => {
    // Title "API Gateway" would never slug-match basename "api"; the explicit id does.
    const model = { elements: [el('cloud.api', 'container', 'API Gateway')] };
    const findings = checkC4Consistency(model, graph(entity('api', 'cloud.api')), POLICY);
    expect(findings).toEqual([]);
  });

  it('c4: false opts an entity out of the direction-2 check', () => {
    const findings = checkC4Consistency({ elements: [] }, graph(entity('legacy', false)), POLICY);
    expect(findings).toEqual([]);
  });

  it('only requireDocumentation kinds are flagged in direction 1', () => {
    // a component is not in the default policy → no direction-1 finding
    const model = { elements: [el('cloud.svc.helper', 'component', 'Helper')] };
    const findings = checkC4Consistency(model, graph(), POLICY);
    expect(findings).toEqual([]);
  });

  it('ignore suppresses by element id, by basename, and by rule', () => {
    const model = { elements: [el('cloud.db', 'container', 'Database')] };
    const g = graph(entity('orphan-thing'));
    // ignore the element id and the orphan basename → both directions silenced
    const bySubject = checkC4Consistency(model, g, { ...POLICY, ignore: ['cloud.db', 'orphan-thing'] });
    expect(bySubject).toEqual([]);
    // ignore by rule name silences the whole rule
    const byRule = checkC4Consistency(model, g, {
      ...POLICY,
      ignore: ['c4-element-without-wiki-entity', 'wiki-entity-without-c4-element'],
    });
    expect(byRule).toEqual([]);
  });

  it('uses the configured severity and sorts findings deterministically', () => {
    const model = { elements: [el('a.one', 'container'), el('a.two', 'container')] };
    const findings = checkC4Consistency(model, graph(), { ...POLICY, severity: 'high' });
    expect(findings.map((f) => f.severity)).toEqual(['high', 'high']);
    // sorted by message within the same rule/severity
    expect(findings[0]!.message < findings[1]!.message).toBe(true);
  });
});

describe('checkC4Consistency — relationships & views (W13, skip-safely)', () => {
  const g = graph(entity('a'), entity('b'));

  it('flags a dangling relationship endpoint (low)', () => {
    const model = {
      elements: [el('a', 'system'), el('b', 'system')],
      relationships: [
        { id: 'r1', source: 'a', target: 'b', title: 'uses' }, // resolves → ok
        { id: 'r2', source: 'a', target: 'ghost', title: 'calls' }, // ghost is unknown
      ],
    };
    const dangling = checkC4Consistency(model, g, POLICY).filter((f) => f.rule === 'c4-relationship-dangling');
    expect(dangling).toHaveLength(1);
    expect(dangling[0]!.severity).toBe('low');
    expect(dangling[0]!.message).toContain('ghost');
  });

  it('flags a documented-kind element drawn in no view (low), passes drawn ones', () => {
    const model = {
      elements: [el('a', 'system'), el('b', 'system')],
      views: [{ id: 'ctx', title: 'Context', elementIds: ['a'] }],
    };
    const undrawn = checkC4Consistency(model, g, POLICY).filter((f) => f.rule === 'c4-element-in-no-view');
    expect(undrawn).toHaveLength(1);
    expect(undrawn[0]!.severity).toBe('low');
    expect(undrawn[0]!.message).toContain('"b"');
  });

  it('runs neither new check when relationships/views are absent (skip-safely, never invents)', () => {
    const rules = checkC4Consistency({ elements: [el('a', 'system')] }, graph(entity('a')), POLICY).map((f) => f.rule);
    expect(rules).not.toContain('c4-relationship-dangling');
    expect(rules).not.toContain('c4-element-in-no-view');
  });

  it('ignore suppresses the new rules by subject id and by rule name', () => {
    const model = {
      elements: [el('a', 'system'), el('b', 'system')],
      relationships: [{ id: 'r2', source: 'a', target: 'ghost', title: '' }],
      views: [{ id: 'ctx', title: 'Context', elementIds: ['a'] }],
    };
    const isNew = (r: string) => r === 'c4-relationship-dangling' || r === 'c4-element-in-no-view';
    expect(checkC4Consistency(model, g, { ...POLICY, ignore: ['r2', 'b'] }).filter((f) => isNew(f.rule))).toEqual([]);
    expect(
      checkC4Consistency(model, g, { ...POLICY, ignore: ['c4-relationship-dangling', 'c4-element-in-no-view'] }).filter(
        (f) => isNew(f.rule),
      ),
    ).toEqual([]);
  });
});
