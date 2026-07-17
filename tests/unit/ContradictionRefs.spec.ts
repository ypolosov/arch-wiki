import {
  contradictionNoteMissingFindings,
  contradictionNoteOrphanFindings,
  isLiveRisk,
  parseContradictionRefs,
  parseRiskRows,
} from '../../src/domain/services/ContradictionRefs';

describe('parseContradictionRefs — link-based, never prose-based', () => {
  it('reads the register wikilink in both its forms', () => {
    const md = 'here the contradiction is logged as [[risks#^C-010|C-010]].\n- **Risks:** [[risks#^C-018]]';
    expect(parseContradictionRefs(md)).toEqual(['C-010', 'C-018']);
  });

  it('ignores a BARE inline-code id — that is prose, not a link', () => {
    // Real notes write `C-015` in prose; counting it would mean guessing what a code span means.
    expect(parseContradictionRefs('the divergence is tracked as contradiction `C-015` in the register')).toEqual([]);
  });

  it('ignores non-contradiction record ids and dedupes', () => {
    expect(parseContradictionRefs('[[risks#^R-014]] [[risks#^C-003]] [[risks#^C-003|C-003]]')).toEqual(['C-003']);
  });
});

describe('parseRiskRows', () => {
  const table = [
    '| ID | Type | Description | Related | Status |',
    '|----|------|-------------|---------|--------|',
    '| C-001 | Contradiction | pipes in [[a-slug|ADR-1]] survive | [[0037-rollback]] | open |',
    '| R-014 | Risk | unrelated | [[x]] | mitigating |',
    '| C-010 | Contradiction | settled | [[0038-casino]] | closed |',
  ].join('\n');

  it('maps columns by name and reads related wikilink targets', () => {
    const rows = parseRiskRows(table);
    expect(rows.map((r) => `${r.id}:${r.type}:${r.status}`)).toEqual([
      'C-001:contradiction:open',
      'R-014:risk:mitigating',
      'C-010:contradiction:closed',
    ]);
    expect(rows[0]!.related).toEqual(['0037-rollback']);
  });

  it('SKIPS a malformed row rather than reading a column out of the wreckage', () => {
    // An unescaped `|` in prose makes the cell count disagree with the header — the row rendered
    // wrong anyway; reading its Status from the middle of the prose produced verdicts like
    // "register row is adr".
    const broken = [
      '| ID | Type | Description | Related | Status |',
      '|----|------|-------------|---------|--------|',
      '| C-099 | Contradiction | an unescaped | pipe in prose | [[x]] | open |',
    ].join('\n');
    expect(parseRiskRows(broken)).toEqual([]);
  });

  it('parses nothing when no header names ID/Type/Status', () => {
    expect(parseRiskRows('| Priority | Scenario |\n| --- | --- |\n| High | x |')).toEqual([]);
  });
});

describe('isLiveRisk', () => {
  it('treats everything but closed as still live', () => {
    for (const s of ['open', 'mitigating', 'accepted', 'OPEN']) expect(isLiveRisk(s)).toBe(true);
    expect(isLiveRisk('closed')).toBe(false);
  });
});

const rows = parseRiskRows(
  [
    '| ID | Type | Description | Related | Status |',
    '|----|------|-------------|---------|--------|',
    '| C-001 | Contradiction | live | [[0037-rollback]] | open |',
    '| C-010 | Contradiction | settled | [[0038-casino]] | closed |',
  ].join('\n'),
);

describe('contradictionNoteOrphanFindings', () => {
  it('flags a page linking a CLOSED contradiction, and frames it as a fact not a verdict', () => {
    const out = contradictionNoteOrphanFindings(
      [{ file: 'adrs/0038-casino.md', basename: '0038-casino', refs: ['C-010'] }],
      rows,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.rule).toBe('adr-contradiction-note-orphan');
    expect(out[0]!.severity).toBe('low');
    expect(out[0]!.message).toMatch(/historical/); // the judgement is left to the reader
  });

  it('is silent for a link to a LIVE contradiction, or to an unknown id', () => {
    expect(contradictionNoteOrphanFindings([{ file: 'a.md', basename: 'a', refs: ['C-001'] }], rows)).toEqual([]);
    expect(contradictionNoteOrphanFindings([{ file: 'a.md', basename: 'a', refs: ['C-999'] }], rows)).toEqual([]);
  });
});

describe('contradictionNoteMissingFindings', () => {
  it('flags a live row whose contested page carries no back-link', () => {
    const out = contradictionNoteMissingFindings(
      [{ file: 'adrs/0037-rollback.md', basename: '0037-rollback', refs: [] }],
      rows,
      'risks.md',
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.rule).toBe('contradiction-note-missing');
    expect(out[0]!.file).toBe('risks.md');
    expect(out[0]!.message).toContain('C-001');
  });

  it('is silent when the back-link exists, and for a CLOSED row', () => {
    expect(
      contradictionNoteMissingFindings(
        [{ file: 'adrs/0037-rollback.md', basename: '0037-rollback', refs: ['C-001'] }],
        rows,
        'risks.md',
      ),
    ).toEqual([]);
    // C-010 is closed → its page owes no note
    expect(
      contradictionNoteMissingFindings([{ file: 'a.md', basename: '0038-casino', refs: [] }], rows, 'risks.md'),
    ).toEqual([]);
  });
});
