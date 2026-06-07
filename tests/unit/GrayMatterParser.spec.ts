import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';

const p = new GrayMatterParser();

describe('GrayMatterParser', () => {
  it('parses absent frontmatter to {}', () => {
    expect(p.parse('# Title\nbody\n')).toEqual({ frontmatter: {}, content: '# Title\nbody\n' });
  });

  it('emits frontmatter with stable (recursively sorted) key order regardless of input order', () => {
    const a = p.stringify({ frontmatter: { type: 'adr', status: 'proposed', tags: ['a', 'b'] }, content: '\n# X\n' });
    const b = p.stringify({ frontmatter: { tags: ['a', 'b'], status: 'proposed', type: 'adr' }, content: '\n# X\n' });
    expect(a).toBe(b);
    expect(a.indexOf('status')).toBeLessThan(a.indexOf('tags'));
    expect(a.indexOf('tags')).toBeLessThan(a.indexOf('type'));
  });

  it('round-trips frontmatter through stringify→parse', () => {
    const out = p.stringify({ frontmatter: { status: 'proposed', tags: ['a', 'b'], type: 'adr' }, content: '\n# X\n' });
    expect(p.parse(out).frontmatter).toEqual({ status: 'proposed', tags: ['a', 'b'], type: 'adr' });
  });

  it('stringify with empty frontmatter returns content unchanged', () => {
    expect(p.stringify({ frontmatter: {}, content: '# only body\n' })).toBe('# only body\n');
  });
});
