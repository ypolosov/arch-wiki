import { C4Element, C4Model, C4Relationship, C4View } from '../../domain/services/C4Consistency';

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

/**
 * `likec4 export json` emits an **array** of project models (one entry per project/stage — a
 * single-project export still yields an array). Unwrap it to the first entry that actually carries
 * a model, so piping the CLI output straight into `validate-c4 --stdin` works. Without this Core
 * silently saw an EMPTY model and reported every wiki entity as undocumented — a wrong verdict from
 * a well-formed input. A plain object (the MCP `read-project-summary` shape) passes through.
 */
function pickModelRoot(raw: unknown): Record<string, unknown> | null {
  if (!Array.isArray(raw)) return asRecord(raw);
  for (const entry of raw) {
    const r = asRecord(entry);
    if (r && (r.elements !== undefined || r.model !== undefined || r.project !== undefined)) return r;
  }
  return null;
}

/** Find a keyed container (`elements`/`relations`/`views`) at the root or one nesting level down. */
function pickKeyed(root: Record<string, unknown>, key: string): unknown {
  if (root[key] !== undefined) return root[key];
  const model = asRecord(root.model);
  if (model?.[key] !== undefined) return model[key];
  const project = asRecord(root.project);
  if (project?.[key] !== undefined) return project[key];
  return undefined;
}

/** Iterate a container that may be an array or an id-keyed map, yielding [key, record] pairs. */
function eachEntry(container: unknown): Array<[string | undefined, Record<string, unknown>]> {
  const out: Array<[string | undefined, Record<string, unknown>]> = [];
  if (Array.isArray(container)) {
    for (const e of container) {
      const rec = asRecord(e);
      if (rec) out.push([undefined, rec]);
    }
  } else {
    const map = asRecord(container);
    if (map) for (const [k, e] of Object.entries(map)) {
      const rec = asRecord(e);
      if (rec) out.push([k, rec]);
    }
  }
  return out;
}

/** A relationship endpoint may be a bare id string or `{ model: id }` / `{ id }` (layouted export). */
function endpointId(v: unknown): string {
  if (typeof v === 'string') return v;
  const r = asRecord(v);
  if (r && typeof r.model === 'string') return r.model;
  if (r && typeof r.id === 'string') return r.id;
  return '';
}

function parseRelationships(root: Record<string, unknown>): C4Relationship[] | undefined {
  // `relations` is the instance map in `likec4 export json`; `relationships` is an alt name.
  // (`specification.relationships` is the KIND spec, not instances — never traversed here.)
  const container = pickKeyed(root, 'relations') ?? pickKeyed(root, 'relationships');
  if (container === undefined) return undefined;
  const out: C4Relationship[] = [];
  for (const [key, raw] of eachEntry(container)) {
    const id = String(raw.id ?? key ?? '');
    const source = endpointId(raw.source);
    const target = endpointId(raw.target);
    if (id && source && target) out.push({ id, source, target, title: String(raw.title ?? '') });
  }
  return out;
}

function parseViews(root: Record<string, unknown>): C4View[] | undefined {
  const container = pickKeyed(root, 'views');
  if (container === undefined) return undefined;
  const out: C4View[] = [];
  for (const [key, raw] of eachEntry(container)) {
    const id = String(raw.id ?? key ?? '');
    if (!id) continue;
    const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
    const elementIds = [
      ...new Set(
        nodes
          .map((n) => {
            const r = asRecord(n);
            return r && typeof r.modelRef === 'string' ? r.modelRef : '';
          })
          .filter((s): s is string => s !== ''),
      ),
    ];
    out.push({ id, title: String(raw.title ?? id), elementIds });
  }
  return out;
}

function toElement(raw: Record<string, unknown>, key: string | undefined): C4Element {
  const id = String(raw.id ?? key ?? '');
  const title = String(raw.title ?? raw.name ?? lastSegment(id) ?? '');
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : undefined;
  return { id, kind: String(raw.kind ?? ''), title, tags };
}

export function normalizeC4ModelJson(raw: unknown): C4Model {
  const root = pickModelRoot(raw);
  if (!root) return { elements: [] };
  const elements: C4Element[] = [];
  for (const [key, rec] of eachEntry(pickKeyed(root, 'elements'))) {
    elements.push(toElement(rec, key));
  }
  const model: C4Model = { elements: elements.filter((e) => e.id !== '' && e.kind !== '') };
  // Relationships + views are OPTIONAL (a `read-project-summary` may omit them): parse when present,
  // leave undefined when absent so Core skips those checks rather than inventing an empty model.
  const relationships = parseRelationships(root);
  if (relationships) model.relationships = relationships;
  const views = parseViews(root);
  if (views) model.views = views;
  return model;
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
