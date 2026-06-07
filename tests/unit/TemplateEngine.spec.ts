import { render } from '../../src/domain/services/TemplateEngine';

describe('render', () => {
  it('replaces known tokens and reports unknown ones', () => {
    const { output, unresolved } = render('# {{id}}: {{title}} ({{date}}) {{missing}}', {
      id: 'QA-001',
      title: 'X',
      date: '2026-06-07',
    });
    expect(output).toBe('# QA-001: X (2026-06-07) {{missing}}');
    expect(unresolved).toEqual(['missing']);
  });

  it('leaves Foam ${...} tabstops untouched', () => {
    const { output, unresolved } = render('Hello ${1:name} {{title}}', { title: 'T' });
    expect(output).toBe('Hello ${1:name} T');
    expect(unresolved).toEqual([]);
  });
});
