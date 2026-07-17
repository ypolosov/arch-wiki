import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  ADR_STATUSES,
  ALLOWED_TRANSITIONS,
  isAdrStatus,
  isLiveStatus,
  isTemplateSlot,
  needsSuccessor,
  RETIRED_STATUS_MAP,
  statusTag,
  TERMINAL_STATUSES,
} from '../../src/domain/model/AdrStatus';
import { adrStatusFindings, bodyStatusLabel, tagStatus } from '../../src/domain/services/DecisionRecord';

describe('AdrStatus — the single source of truth', () => {
  it('is the five-value canon', () => {
    expect([...ADR_STATUSES]).toEqual(['proposed', 'rejected', 'accepted', 'deprecated', 'superseded']);
  });

  it('only `accepted` live-covers a driver', () => {
    expect(isLiveStatus('accepted')).toBe(true);
    for (const s of ['proposed', 'rejected', 'deprecated', 'superseded']) expect(isLiveStatus(s)).toBe(false);
  });

  it('superseded/deprecated owe a successor; the rest do not', () => {
    expect(needsSuccessor('superseded')).toBe(true);
    expect(needsSuccessor('deprecated')).toBe(true);
    expect(needsSuccessor('accepted')).toBe(false);
  });

  it('every terminal status has no onward transition, and every canon status is in the map', () => {
    for (const s of TERMINAL_STATUSES) expect(ALLOWED_TRANSITIONS[s]).toEqual([]);
    for (const s of ADR_STATUSES) expect(ALLOWED_TRANSITIONS[s]).toBeDefined();
    // a proposal is not yet binding → it may still be accepted or rejected
    expect([...ALLOWED_TRANSITIONS.proposed]).toEqual(['accepted', 'rejected']);
    expect([...ALLOWED_TRANSITIONS.accepted]).toEqual(['superseded', 'deprecated']);
  });

  it('maps the retired `partially` onto accepted (decision-state, not implementation-state)', () => {
    expect(RETIRED_STATUS_MAP.partially).toBe('accepted');
    expect(isAdrStatus('partially')).toBe(false);
  });

  it('never judges the reserved template slot', () => {
    expect(isTemplateSlot('0000-template')).toBe(true);
    expect(isTemplateSlot('0001-real-decision')).toBe(false);
  });

  it('statusTag mirrors the status', () => {
    expect(statusTag('Accepted')).toBe('adr/accepted');
  });
});

describe('adrStatusFindings', () => {
  const fm = (status: string, tags: string[] = []) => ({ status, tags });

  it('flags a status outside the canon as HIGH and names the remedy', () => {
    const out = adrStatusFindings('0004-configs', 'adrs/0004-configs.md', fm('partially', ['adr', 'adr/partially']), '');
    const unknown = out.filter((f) => f.rule === 'adr-status-unknown');
    expect(unknown).toHaveLength(1);
    expect(unknown[0]!.severity).toBe('high');
    expect(unknown[0]!.message).toContain('normalize-adr-status');
    expect(unknown[0]!.message).toContain('accepted'); // the retired mapping is named
  });

  it('refuses to guess an unmapped unknown status', () => {
    const out = adrStatusFindings('0099-x', 'adrs/0099-x.md', fm('whatever'), '');
    expect(out[0]!.message).toMatch(/by hand — Core never guesses/);
  });

  it('flags a tag that disagrees with frontmatter', () => {
    const out = adrStatusFindings('0001-x', 'adrs/0001-x.md', fm('accepted', ['adr', 'adr/proposed']), '');
    const inc = out.filter((f) => f.rule === 'adr-status-inconsistent');
    expect(inc).toHaveLength(1);
    expect(inc[0]!.message).toContain('adr/<status> tag');
  });

  it('flags a body label that disagrees with frontmatter', () => {
    const out = adrStatusFindings('0001-x', 'adrs/0001-x.md', fm('accepted', ['adr/accepted']), '- **Status:** proposed\n');
    expect(out.filter((f) => f.rule === 'adr-status-inconsistent')).toHaveLength(1);
  });

  it('is silent when all three carriers agree (no churn on a healthy log)', () => {
    expect(
      adrStatusFindings('0001-x', 'adrs/0001-x.md', fm('accepted', ['adr', 'adr/accepted']), '- **Status:** accepted\n'),
    ).toEqual([]);
  });

  it('never judges the template slot, nor an absent status', () => {
    expect(adrStatusFindings('0000-template', 'adrs/0000-template.md', fm('nonsense'), '')).toEqual([]);
    expect(adrStatusFindings('0001-x', 'adrs/0001-x.md', { status: undefined, tags: [] }, '')).toEqual([]);
  });
});

describe('carrier extraction', () => {
  it('reads the MADR short-form body label', () => {
    expect(bodyStatusLabel('# ADR\n\n- **Status:** Accepted\n')).toBe('accepted');
    expect(bodyStatusLabel('**Status**: superseded.')).toBe('superseded');
    expect(bodyStatusLabel('no label here')).toBe('');
  });

  it('reads the adr/<status> tag', () => {
    expect(tagStatus(['adr', 'adr/accepted'])).toBe('accepted');
    expect(tagStatus(['adr'])).toBe('');
    expect(tagStatus(undefined)).toBe('');
  });
});

// ── Anti-drift: the enum is restated in prose (skill + template). The drift this whole change
// exists to kill began exactly there — the skill declared four statuses while the code accepted five.
// Precedent: version-sync.spec.ts.
describe('ADR status canon does not drift from its prose restatements', () => {
  const root = path.join(__dirname, '..', '..');

  it('the madr-format skill lists exactly the canon', () => {
    const skill = require('fs').readFileSync(path.join(root, 'skills/madr-format/SKILL.md'), 'utf8') as string;
    const line = skill.split('\n').find((l) => /\*\*Status:?\*\*/.test(l) && l.includes('|'));
    expect(line).toBeDefined();
    for (const s of ADR_STATUSES) expect(line!).toContain(s);
    expect(line).not.toContain('partially');
  });

  it('the ADR template scaffolds a canonical status and a matching tag', async () => {
    const tpl = await fs.readFile(path.join(root, 'templates/adr.md'), 'utf8');
    const status = /^status:\s*(\S+)/m.exec(tpl)?.[1] ?? '';
    expect(isAdrStatus(status)).toBe(true);
    expect(tpl).toContain(statusTag(status));
  });
});
