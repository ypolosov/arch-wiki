import { C4Element, C4Model } from '../../domain/services/C4Consistency';

/**
 * Normalizes an external LikeC4 model dump into the neutral `C4Model` Core
 * consumes. Accepts the shapes produced by the LikeC4 MCP `read-project-summary`
 * and by `likec4 export json` — `elements` may be an array or an id-keyed map,
 * and may sit at the root or under `model`/`project`. Defensive on purpose: the
 * orchestrator pipes whatever the tool emits and Core must not crash on shape.
 * Pure (no I/O); the composition root reads the bytes and calls this.
 */

function lastSegment(id: string): string {
  const i = id.lastIndexOf('.');
  return i >= 0 ? id.slice(i + 1) : id;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Find the `elements` container at the root or one nesting level down. */
function pickElements(root: Record<string, unknown>): unknown {
  if (root.elements !== undefined) return root.elements;
  const model = asRecord(root.model);
  if (model?.elements !== undefined) return model.elements;
  const project = asRecord(root.project);
  if (project?.elements !== undefined) return project.elements;
  return undefined;
}

function toElement(raw: Record<string, unknown>, key: string | undefined): C4Element {
  const id = String(raw.id ?? key ?? '');
  const title = String(raw.title ?? raw.name ?? lastSegment(id) ?? '');
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : undefined;
  return { id, kind: String(raw.kind ?? ''), title, tags };
}

export function normalizeC4ModelJson(raw: unknown): C4Model {
  const root = asRecord(raw);
  if (!root) return { elements: [] };
  const container = pickElements(root);
  const elements: C4Element[] = [];
  if (Array.isArray(container)) {
    for (const e of container) {
      const rec = asRecord(e);
      if (rec) elements.push(toElement(rec, undefined));
    }
  } else {
    const map = asRecord(container);
    if (map) for (const [key, e] of Object.entries(map)) {
      const rec = asRecord(e);
      if (rec) elements.push(toElement(rec, key));
    }
  }
  return { elements: elements.filter((e) => e.id !== '' && e.kind !== '') };
}

/**
 * Best-effort regex fallback over `*.c4` DSL text — the LAST resort when no
 * model-JSON is available (plan §12.4/§12.10). LOSSY: it captures top-level
 * `id = kind 'Title'` and `kind id 'Title'` declarations only; it does NOT
 * reconstruct nesting / fully-qualified ids / relationships. Prefer model-JSON.
 */
export function parseC4Sources(text: string): C4Model {
  const elements: C4Element[] = [];
  const seen = new Set<string>();
  const push = (id: string, kind: string, title?: string): void => {
    if (!id || !kind || seen.has(id)) return;
    seen.add(id);
    elements.push({ id, kind, title: (title ?? id).trim() });
  };
  // strip line/block comments to reduce false matches
  const src = text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // `id = kind 'Title'`  (Title optional)
  const assign = /(^|[\s{])([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*(?:'([^']*)'|"([^"]*)")?/g;
  for (let m; (m = assign.exec(src)); ) push(m[2]!, m[3]!, m[4] ?? m[5]);
  // `kind id 'Title'`  (e.g. `container backend 'Backend'`)
  const decl = /(^|[\s{])([A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*(?:'([^']*)'|"([^"]*)")/g;
  for (let m; (m = decl.exec(src)); ) push(m[3]!, m[2]!, m[4] ?? m[5]);
  return { elements: elements.sort((a, b) => a.id.localeCompare(b.id)) };
}
