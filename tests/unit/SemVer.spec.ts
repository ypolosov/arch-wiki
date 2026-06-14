import { isNewerVersion, parseSemver } from '../../src/domain/services/SemVer';

describe('SemVer (pure)', () => {
  it('parses X.Y.Z and rejects non-semver', () => {
    expect(parseSemver('0.7.1')).toEqual([0, 7, 1]);
    expect(parseSemver(' 1.2.3 ')).toEqual([1, 2, 3]);
    expect(parseSemver('unknown')).toBeNull();
    expect(parseSemver('1.2')).toBeNull();
  });

  it('isNewerVersion: strict, component-wise, false on equal or unparseable', () => {
    expect(isNewerVersion('0.7.1', '0.7.0')).toBe(true);
    expect(isNewerVersion('0.8.0', '0.7.9')).toBe(true);
    expect(isNewerVersion('1.0.0', '0.9.9')).toBe(true);
    expect(isNewerVersion('0.7.0', '0.7.0')).toBe(false); // equal → not newer (no false restart nag)
    expect(isNewerVersion('0.6.0', '0.7.0')).toBe(false); // older
    expect(isNewerVersion('unknown', '0.7.0')).toBe(false);
    expect(isNewerVersion('0.7.0', 'unknown')).toBe(false);
  });
});
