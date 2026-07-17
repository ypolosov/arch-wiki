import { isSeparatorRow, splitTableRow } from '../../src/domain/services/MarkdownTable';

describe('splitTableRow — a `|` inside an atomic span is not a separator', () => {
  it('keeps a wikilink alias intact', () => {
    // Real register rows cite ADRs as [[slug|ADR-0050]]; a naive split shredded them.
    expect(splitTableRow('| C-012 | Contradiction | see [[0050-e2e|ADR-0050]] and [[0051-pkg|ADR-0051]] | x | closed |')).toEqual(
      ['C-012', 'Contradiction', 'see [[0050-e2e|ADR-0050]] and [[0051-pkg|ADR-0051]]', 'x', 'closed'],
    );
  });

  it('keeps an inline-code span intact', () => {
    expect(splitTableRow('| C-005 | Contradiction | code says `pill|Hot` not story | y | mitigating |')).toEqual(
      ['C-005', 'Contradiction', 'code says `pill|Hot` not story', 'y', 'mitigating'],
    );
  });

  it('handles double-backtick spans and several spans in one cell', () => {
    expect(splitTableRow('| a | ``x|y`` and `z|w` | b |')).toEqual(['a', '``x|y`` and `z|w`', 'b']);
  });

  it('splits a plain row and trims', () => {
    expect(splitTableRow('|  a |b  | c |')).toEqual(['a', 'b', 'c']);
  });

  it('is unaffected by a row without atomic spans', () => {
    expect(splitTableRow('| ID | Type | Description | Related | Status |')).toEqual([
      'ID', 'Type', 'Description', 'Related', 'Status',
    ]);
  });
});

describe('isSeparatorRow', () => {
  it('recognizes separators in every alignment form', () => {
    expect(isSeparatorRow(['---', ':--', '--:', ':-:'])).toBe(true);
    expect(isSeparatorRow(['----------', '------'])).toBe(true);
  });
  it('rejects content rows', () => {
    expect(isSeparatorRow(['C-001', 'Contradiction'])).toBe(false);
    expect(isSeparatorRow([])).toBe(false);
  });
});
