import { extractMeasure, qaMeasureFinding } from '../../src/domain/services/QualityAttribute';

describe('extractMeasure', () => {
  it('reads a Scenario table-row measure', () => {
    expect(extractMeasure('| **Measure** | p95 < 200ms; zero timeouts |')).toBe('p95 < 200ms; zero timeouts');
  });
  it('reads a bold-label measure', () => {
    expect(extractMeasure('- **Measure:** 99.9% uptime')).toBe('99.9% uptime');
  });
  it('returns null when no measure is stated', () => {
    expect(extractMeasure('## Scenario\nno measure here')).toBeNull();
  });
});

describe('qaMeasureFinding', () => {
  it('flags a short vacuous measure (a wish)', () => {
    expect(qaMeasureFinding('QA-1', 'q.md', '- **Measure:** fast and reliable')?.rule).toBe('qa-measure-untestable');
  });
  it('passes a numeric measure', () => {
    expect(qaMeasureFinding('QA-1', 'q.md', '- **Measure:** p95 < 200ms')).toBeNull();
    expect(qaMeasureFinding('QA-1', 'q.md', '| **Measure** | 95th percentile < 500ms |')).toBeNull();
  });
  it('passes a long qualitative invariant even without a number (left to the LLM rubric)', () => {
    const m = '| **Measure** | Same tag → same deployed state (idempotent); no data loss on re-apply; rollback restores the previous good state |';
    expect(qaMeasureFinding('QA-1', 'q.md', m)).toBeNull();
  });
  it('ignores an empty or absent measure (left to required-section)', () => {
    expect(qaMeasureFinding('QA-1', 'q.md', '- **Measure:** ')).toBeNull();
    expect(qaMeasureFinding('QA-1', 'q.md', 'no measure at all')).toBeNull();
  });
});
