import { replaceManagedRegion } from '../../src/domain/services/ManagedRegion';

const START = '<!-- s -->';
const END = '<!-- e -->';
const SCAFFOLD = '# Title\n\nIntro.\n\n';

describe('replaceManagedRegion', () => {
  it('creates a new file with the region appended to the scaffold', () => {
    const out = replaceManagedRegion(null, START, END, '- a\n- b', SCAFFOLD);
    expect(out).toBe('# Title\n\nIntro.\n\n<!-- s -->\n- a\n- b\n<!-- e -->\n');
  });

  it('replaces only the region, preserving content before and after', () => {
    const cur = `# T\n\nbefore\n\n${START}\nOLD\n${END}\n\nafter human note\n`;
    const out = replaceManagedRegion(cur, START, END, '- new', SCAFFOLD);
    expect(out).toContain('before');
    expect(out).toContain('after human note');
    expect(out).toContain(`${START}\n- new\n${END}`);
    expect(out).not.toContain('OLD');
  });

  it('empty body yields an empty region, never a deletion', () => {
    const cur = `# T\n\n${START}\n- old\n${END}\n\nkeep\n`;
    const out = replaceManagedRegion(cur, START, END, '', SCAFFOLD);
    expect(out).toContain(`${START}\n${END}`);
    expect(out).toContain('keep');
    expect(out).not.toContain('- old');
  });

  it('inserts at an anchor after the H1 when markers are absent', () => {
    const cur = '# Heading\n\nsome notes\n';
    const out = replaceManagedRegion(cur, START, END, '- x', SCAFFOLD);
    expect(out).toContain('# Heading');
    expect(out).toContain('some notes');
    expect(out).toContain(`${START}\n- x\n${END}`);
    // region placed after the H1, before/around the notes (not silently appended at EOF only)
    expect(out.indexOf('# Heading')).toBeLessThan(out.indexOf(START));
  });

  it('inserts after frontmatter when there is no H1', () => {
    const cur = '---\ntype: x\n---\nbody text\n';
    const out = replaceManagedRegion(cur, START, END, '- y', SCAFFOLD);
    expect(out.indexOf('---', 1)).toBeLessThan(out.indexOf(START));
    expect(out).toContain('body text');
  });
});
