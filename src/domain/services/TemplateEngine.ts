export interface RenderResult {
  output: string;
  /** Tokens present in the template but absent from `vars` (left untouched). */
  unresolved: string[];
}

const TOKEN = /\{\{(\w+)\}\}/g;

/**
 * Deterministic mustache-lite substitution of `{{key}}` tokens. Unknown tokens
 * are left verbatim and reported, so Foam's own `${...}` tabstops are untouched.
 */
export function render(template: string, vars: Readonly<Record<string, string>>): RenderResult {
  const unresolved = new Set<string>();
  const output = template.replace(TOKEN, (_match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key]!;
    unresolved.add(key);
    return `{{${key}}}`;
  });
  return { output, unresolved: [...unresolved] };
}
