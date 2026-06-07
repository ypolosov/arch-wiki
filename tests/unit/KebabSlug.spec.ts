import { slugify, requireSlug } from '../../src/domain/services/KebabSlug';

describe('slugify', () => {
  it('kebab-cases ascii titles', () => {
    expect(slugify('API Response Time')).toBe('api-response-time');
    expect(slugify('  Multi   space & punct!! ')).toBe('multi-space-punct');
  });

  it('strips diacritics', () => {
    expect(slugify('Café Déjà')).toBe('cafe-deja');
  });

  it('returns empty for a non-latin title', () => {
    expect(slugify('Опросник')).toBe('');
  });

  it('requireSlug throws on non-latin', () => {
    expect(() => requireSlug('Опросник')).toThrow();
    expect(requireSlug('Use Kafka')).toBe('use-kafka');
  });
});
