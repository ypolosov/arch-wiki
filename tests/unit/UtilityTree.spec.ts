import {
  parseUtilityPriority,
  scoreUtility,
  tierOf,
  isUnsetPriority,
  parseUtilityTable,
  rankUtilityTree,
  utilityPriorityFindings,
} from '../../src/domain/services/UtilityTree';

describe('UtilityTree — CharacteristicSpace + ScoringMethod (FPF A.19)', () => {
  describe('parseUtilityPriority', () => {
    it('parses the two-axis pair in every authored form', () => {
      for (const raw of ['H,M', '(H,M)', 'H/M', 'H M', 'h,m']) {
        expect(parseUtilityPriority(raw)).toEqual({ importance: 'H', difficulty: 'M' });
      }
    });
    it('parses the short importance-only marker', () => {
      expect(parseUtilityPriority('H')).toEqual({ importance: 'H', difficulty: null });
      expect(parseUtilityPriority('l')).toEqual({ importance: 'L', difficulty: null });
    });
    it('rejects non-H/M/L prose and over-long letter runs', () => {
      for (const raw of ['HIGH', 'critical', 'H,M,L', 'X', '1', 'HM extra words']) {
        expect(parseUtilityPriority(raw)).toBeNull();
      }
    });
  });

  describe('scoreUtility — importance-dominant, deterministic', () => {
    it('orders importance above difficulty', () => {
      // any H-importance scenario outranks any M-importance scenario
      expect(scoreUtility({ importance: 'H', difficulty: 'L' })).toBeGreaterThan(
        scoreUtility({ importance: 'M', difficulty: 'H' }),
      );
    });
    it('breaks ties within a band by difficulty', () => {
      expect(scoreUtility({ importance: 'H', difficulty: 'H' })).toBeGreaterThan(
        scoreUtility({ importance: 'H', difficulty: 'M' }),
      );
    });
    it('treats a short marker as mid-difficulty, keeping it in its importance band', () => {
      const short = scoreUtility({ importance: 'H', difficulty: null });
      expect(short).toBe(scoreUtility({ importance: 'H', difficulty: 'M' }));
      // still strictly above any lower-importance scenario (bands are disjoint)
      expect(short).toBeGreaterThan(scoreUtility({ importance: 'M', difficulty: 'H' }));
    });
  });

  it('tierOf classifies by importance', () => {
    expect(tierOf({ importance: 'H', difficulty: 'L' })).toBe('top');
    expect(tierOf({ importance: 'M', difficulty: 'H' })).toBe('medium');
    expect(tierOf({ importance: 'L', difficulty: null })).toBe('low');
  });

  it('isUnsetPriority recognizes placeholders only', () => {
    for (const p of ['', '—', '-', 'n/a', 'TBD', '?']) expect(isUnsetPriority(p)).toBe(true);
    expect(isUnsetPriority('H')).toBe(false);
    expect(isUnsetPriority('H,M')).toBe(false);
  });

  describe('parseUtilityTable + rankUtilityTree', () => {
    const md = [
      '# Utility Tree',
      '',
      '| Driver | Scenario | Priority |',
      '| --- | --- | --- |',
      '| [[QA-001]] | latency | M,H |',
      '| [[QA-002]] | availability | H,M |',
      '| [[QA-003]] | audit | H |',
      '| [[QA-004]] | nice-to-have | garbage |',
    ].join('\n');

    it('parses rows and extracts the driver id from a wikilink', () => {
      const rows = parseUtilityTable(md);
      expect(rows.map((r) => r.driver)).toEqual(['QA-001', 'QA-002', 'QA-003', 'QA-004']);
      expect(rows[0]).toEqual({ driver: 'QA-001', scenario: 'latency', priority: 'M,H' });
    });

    it('REGRESSION: ignores a foreign table with a different schema', () => {
      // The real shape that broke this: Priority is column 1, and the rows are someone else's.
      // Position-keyed parsing read the SCENARIO prose as a priority → 73 false findings.
      const foreign = [
        '# Quality Attribute Utility Tree',
        '',
        '| Priority | Quality Attribute | Scenario | Rating |',
        '|----------|------------------|----------|--------|',
        '| **Critical** | Performance | API Response Time — Platform APIs respond <200ms for 95% requests | 1 |',
        '| **Critical** | Modifiability | Code Structure — Microservices support 15+ regulatory regions | 1 |',
      ].join('\n');
      expect(parseUtilityTable(foreign)).toEqual([]);
      expect(utilityPriorityFindings('utility-tree.md', foreign)).toEqual([]);
    });

    it('maps columns by NAME, not position (managed register, any column order)', () => {
      const reordered = [
        '| Priority | Driver | Scenario |',
        '| --- | --- | --- |',
        '| H,M | [[QA-009]] | availability |',
      ].join('\n');
      expect(parseUtilityTable(reordered)).toEqual([
        { driver: 'QA-009', scenario: 'availability', priority: 'H,M' },
      ]);
    });

    it('ranks parseable rows first by the ScoringMethod, unparseable last', () => {
      const ranked = rankUtilityTree(parseUtilityTable(md));
      // scores: H,M=11, H(mid)=11, M,H=9; the 11-tie breaks by driver id asc (QA-002 < QA-003);
      // garbage has no score → last, rank null
      expect(ranked.map((r) => r.driver)).toEqual(['QA-002', 'QA-003', 'QA-001', 'QA-004']);
      expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, null]);
      expect(ranked[3]!.score).toBeNull();
    });
  });

  describe('utilityPriorityFindings', () => {
    it('flags only a present, non-placeholder, unparseable priority', () => {
      const md = [
        '| Driver | Scenario | Priority |',
        '| --- | --- | --- |',
        '| [[QA-001]] | a | H,M |', // valid pair — ok
        '| [[QA-002]] | b | H |', // valid short marker — ok (no false positive)
        '| [[QA-003]] | c | — |', // unset placeholder — skipped
        '| [[QA-004]] | d | soon |', // ill-formed — flagged
      ].join('\n');
      const findings = utilityPriorityFindings('utility-tree.md', md);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.rule).toBe('utility-priority-illformed');
      expect(findings[0]!.severity).toBe('low');
      expect(findings[0]!.message).toContain('QA-004');
    });

    it('returns nothing for a well-formed tree (no mass churn)', () => {
      const md = [
        '| Driver | Scenario | Priority |',
        '| --- | --- | --- |',
        '| [[QA-001]] | a | H |',
        '| [[QA-002]] | b | M |',
        '| [[QA-003]] | c | L |',
      ].join('\n');
      expect(utilityPriorityFindings('utility-tree.md', md)).toEqual([]);
    });
  });
});
