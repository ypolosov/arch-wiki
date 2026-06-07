import { planMigration } from '../../src/application/usecases/Migrate';
import { Migration } from '../../src/migrations/types';

const stub = (from: number, to: number): Migration => ({
  from,
  to,
  description: `${from}->${to}`,
  up: async () => [],
});

const reg = [stub(0, 1), stub(1, 2)];

describe('planMigration', () => {
  it('builds a contiguous chain', () => {
    expect(planMigration(0, 2, reg).map((m) => m.to)).toEqual([1, 2]);
    expect(planMigration(1, 2, reg).map((m) => m.to)).toEqual([2]);
    expect(planMigration(2, 2, reg)).toEqual([]);
  });

  it('throws on a gap in the chain', () => {
    expect(() => planMigration(0, 2, [stub(0, 1)])).toThrow();
  });

  it('refuses to migrate down', () => {
    expect(() => planMigration(2, 1, reg)).toThrow();
  });
});
