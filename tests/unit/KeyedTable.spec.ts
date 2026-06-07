import { upsertKeyedRow, KeyedTableSpec } from '../../src/domain/services/KeyedTable';

const SPEC: KeyedTableSpec = {
  headerMark: '| K |',
  header: '| K | V |\n| --- | --- |\n',
  scaffold: '# T\n\n| K | V |\n| --- | --- |\n',
};

describe('upsertKeyedRow', () => {
  it('creates a new file from the scaffold', () => {
    const r = upsertKeyedRow(null, '| a |', '| a | 1 |', SPEC);
    expect(r.changed).toBe(true);
    expect(r.content).toBe('# T\n\n| K | V |\n| --- | --- |\n| a | 1 |\n');
  });

  it('appends a new row to an existing table', () => {
    const cur = '# T\n\n| K | V |\n| --- | --- |\n| a | 1 |\n';
    const r = upsertKeyedRow(cur, '| b |', '| b | 2 |', SPEC);
    expect(r.changed).toBe(true);
    expect(r.content.endsWith('| a | 1 |\n| b | 2 |\n')).toBe(true);
  });

  it('is a no-op when the identical row already exists', () => {
    const cur = '# T\n\n| K | V |\n| --- | --- |\n| a | 1 |\n';
    const r = upsertKeyedRow(cur, '| a |', '| a | 1 |', SPEC);
    expect(r.changed).toBe(false);
    expect(r.content).toBe(cur);
  });

  it('replaces the row in place when the key matches but the row differs', () => {
    const cur = '# T\n\n| K | V |\n| --- | --- |\n| a | 1 |\n';
    const r = upsertKeyedRow(cur, '| a |', '| a | 9 |', SPEC);
    expect(r.changed).toBe(true);
    expect(r.content).toContain('| a | 9 |');
    expect(r.content).not.toContain('| a | 1 |');
  });

  it('inserts the header when an existing file lacks the table', () => {
    const r = upsertKeyedRow('# Notes\n', '| a |', '| a | 1 |', SPEC);
    expect(r.content).toContain('| K | V |');
    expect(r.content).toContain('| a | 1 |');
  });
});
