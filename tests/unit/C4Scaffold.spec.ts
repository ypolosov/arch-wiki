import { renderC4Element, renderC4View } from '../../src/domain/services/C4Scaffold';

describe('renderC4Element — additive `extend`, never edits the hand-authored model', () => {
  it('renders a minimal element', () => {
    expect(renderC4Element({ parent: 'product.gaming', id: 'payments', kind: 'container', title: 'Payments' }))
      .toContain("  extend product.gaming {\n    payments = container 'Payments'\n  }");
  });

  it('renders tags BEFORE technology — LikeC4 rejects the other order', () => {
    // Regression: `#tag` after `technology` fails real `likec4 validate` with
    // "Expecting token of type '}' but found `#`". Verified end-to-end against LikeC4.
    const out = renderC4Element({
      parent: 'product.gaming',
      id: 'connector',
      kind: 'container',
      title: 'Stripe Connector',
      technology: 'NestJS',
      tags: ['planned', '#deferred'], // a leading # is tolerated and normalized
    });
    expect(out).toContain("    connector = container 'Stripe Connector' {\n      #planned\n      #deferred\n      technology 'NestJS'\n    }");
    expect(out.indexOf('#planned')).toBeLessThan(out.indexOf('technology'));
  });

  it('picks a quote the label does not contain', () => {
    expect(renderC4Element({ parent: 'a', id: 'b', kind: 'system', title: "Operator's CRM" })).toContain(
      '"Operator\'s CRM"',
    );
  });

  it('rejects a malformed parent / id / kind (fail-fast, no file written)', () => {
    const base = { parent: 'product.gaming', id: 'payments', kind: 'container', title: 'X' };
    expect(() => renderC4Element({ ...base, parent: 'product gaming' })).toThrow(/--parent/);
    expect(() => renderC4Element({ ...base, id: '9lives' })).toThrow(/--id/);
    expect(() => renderC4Element({ ...base, kind: 'con-tainer' })).toThrow(/--kind/);
    expect(() => renderC4Element({ ...base, title: '' })).toThrow(/empty/);
  });

  it('never emits a bare `model {` overwrite — always an extend block', () => {
    const out = renderC4Element({ parent: 'a.b', id: 'c', kind: 'system', title: 'C' });
    expect(out).toMatch(/model \{\n  extend a\.b \{/);
  });
});

describe('renderC4View — additive new view file', () => {
  it('renders an unscoped view with a title', () => {
    const out = renderC4View({ id: 'payments', title: 'Payments — target' });
    expect(out).toContain("views {\n  view payments {\n    title 'Payments — target'\n    include *\n  }\n}");
  });

  it('renders a scoped view (`view <id> of <fqn>`)', () => {
    expect(renderC4View({ id: 'gaming', of: 'product.gaming' })).toContain('  view gaming of product.gaming {');
  });

  it('tells the author how to wire the arc42 hub', () => {
    expect(renderC4View({ id: 'payments' })).toContain('`view payments`');
  });

  it('rejects a malformed id / scope', () => {
    expect(() => renderC4View({ id: 'has-dash' })).toThrow(/--id/);
    expect(() => renderC4View({ id: 'ok', of: 'bad fqn' })).toThrow(/--of/);
  });
});
