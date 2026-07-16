import { parseViewRefs, c4ViewMissingFindings } from '../../src/domain/services/C4ViewRefs';

describe('parseViewRefs — only the unambiguous keyword forms', () => {
  it('reads `view <id>` and `deployment view <id>` from inline code', () => {
    // The real gt conventions: §3/§5 use `view x`; §7 uses `deployment view x`.
    const md = [
      '- Context view: [c4/src/views.c4](../c4/src/views.c4) → `view context` ("Logical / C4 L1")',
      '- Containers (L2): `view containers`',
      '- Deployment view: `deployment view deploymentProd` ("Deployment / PROD")',
    ].join('\n');
    expect(parseViewRefs(md)).toEqual(['containers', 'context', 'deploymentProd']);
  });

  it('ignores prose that merely contains the word "view"', () => {
    // Without backticks these are prose, not references — the old naive grep matched "view in"/"view the".
    expect(parseViewRefs('Static decomposition, visualized with C4 Container view in the diagram.')).toEqual([]);
    expect(parseViewRefs('See the view the team maintains.')).toEqual([]);
  });

  it('ignores BARE backticked ids — every code span would match (§6 dynamic views)', () => {
    // gt §6 lists dynamic views as bare ids; parsing them would also swallow `npm run validate`.
    const md = '- Dynamic views: `coinShopPurchase`, `scRedemption`, `walletBalancePush`.\n- Run `npm run validate`.';
    expect(parseViewRefs(md)).toEqual([]);
  });

  it('dedupes and sorts', () => {
    expect(parseViewRefs('`view b` `view a` `view b`')).toEqual(['a', 'b']);
  });
});

describe('c4ViewMissingFindings', () => {
  const hubs = [
    { file: 'arc42/05-building-block-view.md', basename: '05-building-block-view', refs: ['containers', 'ghost'] },
  ];

  it('flags a hub that shows a view the model does not define', () => {
    const out = c4ViewMissingFindings(hubs, new Set(['containers', 'context']));
    expect(out).toHaveLength(1);
    expect(out[0]!.rule).toBe('c4-view-missing');
    expect(out[0]!.file).toBe('arc42/05-building-block-view.md');
    expect(out[0]!.message).toContain('ghost');
  });

  it('is silent when every promised view resolves (no churn on a healthy project)', () => {
    expect(c4ViewMissingFindings(hubs, new Set(['containers', 'ghost']))).toEqual([]);
    expect(c4ViewMissingFindings([], new Set(['x']))).toEqual([]);
  });
});
