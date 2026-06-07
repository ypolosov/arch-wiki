import { DomainError } from '../errors';

// Combining diacritical marks (U+0300–U+036F), e.g. the accents left after NFKD.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Deterministically turn a title into a kebab-case ASCII slug. */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alnum runs → single dash
    .replace(/-{2,}/g, '-') // collapse repeats
    .replace(/^-+|-+$/g, ''); // trim edges
}

/**
 * Like {@link slugify} but errors when the result is empty (e.g. a non-latin
 * title such as a Russian phrase). The caller should then pass an explicit slug.
 */
export function requireSlug(title: string): string {
  const slug = slugify(title);
  if (!slug) {
    throw new DomainError(
      `cannot derive a slug from title "${title}" (no latin characters); pass an explicit --slug`,
      1,
    );
  }
  return slug;
}
