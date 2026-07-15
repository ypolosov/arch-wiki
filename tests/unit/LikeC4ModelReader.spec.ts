import { normalizeC4ModelJson, parseC4Sources } from '../../src/adapters/c4/LikeC4ModelReader';

describe('normalizeC4ModelJson', () => {
  it('reads an array of elements at the root', () => {
    const m = normalizeC4ModelJson({
      elements: [
        { id: 'cloud', kind: 'system', title: 'Cloud' },
        { id: 'cloud.api', kind: 'container', name: 'API' },
      ],
    });
    expect(m.elements).toEqual([
      { id: 'cloud', kind: 'system', title: 'Cloud', tags: undefined },
      { id: 'cloud.api', kind: 'container', title: 'API', tags: undefined },
    ]);
  });

  it('reads an id-keyed map and derives the title from the id leaf when absent', () => {
    const m = normalizeC4ModelJson({
      elements: {
        'cloud.backend': { kind: 'container' },
        'cloud.backend.api': { kind: 'component', title: 'API' },
      },
    });
    const byId = Object.fromEntries(m.elements.map((e) => [e.id, e]));
    expect(byId['cloud.backend']!.title).toBe('backend');
    expect(byId['cloud.backend.api']!.title).toBe('API');
  });

  it('finds elements nested under model/project and drops malformed entries', () => {
    expect(normalizeC4ModelJson({ model: { elements: [{ id: 'x', kind: 'system' }] } }).elements).toHaveLength(1);
    expect(normalizeC4ModelJson({ project: { elements: [{ id: 'y', kind: 'system' }] } }).elements).toHaveLength(1);
    // missing id or kind → dropped
    expect(normalizeC4ModelJson({ elements: [{ kind: 'system' }, { id: 'z' }] }).elements).toEqual([]);
  });

  it('returns an empty model for junk input (defensive, never throws)', () => {
    expect(normalizeC4ModelJson(null).elements).toEqual([]);
    expect(normalizeC4ModelJson(42).elements).toEqual([]);
    expect(normalizeC4ModelJson({}).elements).toEqual([]);
  });
});

describe('parseC4Sources (regex fallback)', () => {
  it('captures `id = kind \'Title\'` and `kind id \'Title\'` declarations', () => {
    const src = `
      // a comment
      model {
        customer = person 'Customer'
        cloud = system 'Cloud System' {
          container backend 'Backend'
        }
      }
    `;
    const ids = parseC4Sources(src).elements.map((e) => `${e.kind}:${e.id}`);
    expect(ids).toContain('person:customer');
    expect(ids).toContain('system:cloud');
    expect(ids).toContain('container:backend');
  });
});

describe('normalizeC4ModelJson — relationships & views (likec4 export json)', () => {
  it('parses the layouted `relations` map with `{model:id}` endpoints', () => {
    const m = normalizeC4ModelJson({
      elements: { a: { id: 'a', kind: 'system' }, b: { id: 'b', kind: 'system' } },
      relations: {
        r1: { id: 'r1', title: 'uses', source: { model: 'a' }, target: { model: 'b' } },
      },
    });
    expect(m.relationships).toEqual([{ id: 'r1', source: 'a', target: 'b', title: 'uses' }]);
  });

  it('parses views and collects drawn element ids from each node modelRef', () => {
    const m = normalizeC4ModelJson({
      elements: { a: { id: 'a', kind: 'system' } },
      views: {
        index: {
          id: 'index',
          title: 'C4 / index',
          nodes: [{ id: 'n1', modelRef: 'a' }, { id: 'n2', modelRef: 'a' }, { id: 'n3' }],
          edges: [],
        },
      },
    });
    expect(m.views).toEqual([{ id: 'index', title: 'C4 / index', elementIds: ['a'] }]); // deduped, node w/o modelRef dropped
  });

  it('accepts bare-string relationship endpoints too', () => {
    const m = normalizeC4ModelJson({
      elements: [{ id: 'a', kind: 'system' }, { id: 'b', kind: 'system' }],
      relationships: [{ id: 'r', source: 'a', target: 'b' }],
    });
    expect(m.relationships).toEqual([{ id: 'r', source: 'a', target: 'b', title: '' }]);
  });

  it('leaves relationships/views UNDEFINED when the source omits them (skip-safely)', () => {
    const m = normalizeC4ModelJson({ elements: [{ id: 'a', kind: 'system' }] });
    expect(m.relationships).toBeUndefined();
    expect(m.views).toBeUndefined();
  });
});
