import { sourceLoss, sourceLossMessage, SourceLossMode } from '../../src/domain/services/SourceLoss';

describe('SourceLoss (FPF A.6.3.CSC typed source-loss vocabulary)', () => {
  it('derives a byte-identical message for an enumerating mode', () => {
    const l = sourceLoss('repo-relative-link-neutralized', ['../iterations/', 'CLAUDE.md']);
    expect(l.mode).toBe('repo-relative-link-neutralized');
    expect(l.subjects).toEqual(['../iterations/', 'CLAUDE.md']);
    expect(l.message).toBe('neutralized 2 repo-relative link(s) to plain text: ../iterations/, CLAUDE.md');
  });

  it('reproduces the historical warning strings exactly (backward compatibility)', () => {
    // These strings were the pre-typing free-text warnings in RenderConfluencePayload — they must
    // not drift, or the `warnings[]` display surface (and any consumer) would change.
    expect(sourceLossMessage('local-image-stubbed', ['../c4/context.png'])).toBe(
      'stubbed 1 local image(s) as C4 diagram placeholder(s): ../c4/context.png',
    );
    expect(sourceLossMessage('provenance-section-stripped')).toBe(
      'stripped the `## Sources` provenance section (git source-of-truth is not mirrored)',
    );
    expect(sourceLossMessage('provenance-field-stripped')).toBe(
      'stripped a `**Source:**` field citing the git source-of-truth',
    );
    expect(sourceLossMessage('repo-path-renamed')).toBe(
      'neutralized repo-internal path reference(s) — git source-of-truth is not mirrored',
    );
  });

  it('copies subjects defensively (no shared mutable reference)', () => {
    const subjects = ['a'];
    const l = sourceLoss('repo-relative-link-neutralized', subjects);
    subjects.push('b');
    expect(l.subjects).toEqual(['a']);
  });

  it('covers every mode with a non-empty message', () => {
    const modes: SourceLossMode[] = [
      'repo-relative-link-neutralized',
      'local-image-stubbed',
      'provenance-section-stripped',
      'provenance-field-stripped',
      'repo-path-renamed',
    ];
    for (const m of modes) expect(sourceLossMessage(m).length).toBeGreaterThan(0);
  });
});
