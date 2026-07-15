import { optionsSectionState, adrOptionsEmptyFinding } from '../../src/domain/services/DecisionRecord';

describe('optionsSectionState', () => {
  it('is filled for numbered, bullet, OR table option formats', () => {
    expect(optionsSectionState('## Considered Options\n\n1. **A**\n2. **B**\n\n## Decision Outcome\n')).toBe('filled');
    expect(optionsSectionState('## Considered Options\n\n* **Sealed Secrets**\n* **Vault**\n')).toBe('filled');
    expect(optionsSectionState('## Considered options:\n\n| Opt | X |\n| --- | --- |\n| a | b |\n')).toBe('filled');
  });
  it('is empty for a present-but-blank section (comments do not count)', () => {
    expect(optionsSectionState('## Considered Options\n\n<!-- todo -->\n\n## Decision\n')).toBe('empty');
  });
  it('is absent when there is no Considered Options heading', () => {
    expect(optionsSectionState('## Context\nno options here')).toBe('absent');
  });
});

describe('adrOptionsEmptyFinding', () => {
  it('flags an accepted ADR with an empty options section', () => {
    expect(adrOptionsEmptyFinding('0001-x', 'a.md', 'accepted', '## Considered Options\n\n## Decision\n')?.rule).toBe('adr-options-empty');
  });
  it('never fires on a filled section, a non-accepted ADR, or an absent section', () => {
    expect(adrOptionsEmptyFinding('0001-x', 'a.md', 'accepted', '## Considered Options\n1. A\n2. B\n')).toBeNull();
    expect(adrOptionsEmptyFinding('0001-x', 'a.md', 'proposed', '## Considered Options\n\n## Decision\n')).toBeNull();
    expect(adrOptionsEmptyFinding('0001-x', 'a.md', 'accepted', '## Context\nno options')).toBeNull();
  });
});
