---
description: Migrate (or first-time adopt) the target docs/architecture wiki onto the current arch-wiki schema — safe and idempotent.
allowed-tools: Bash(arch-wiki:*)
---

Bring `docs/architecture/` up to the current arch-wiki schema. The deterministic
CLI owns the migration; it only writes `.arch-wiki/*` and never edits existing
artifacts or `raw/`.

1. Check status (pre-approved): `arch-wiki version --target` then `arch-wiki migrate --status`.
2. **First-time wiki** (no `.arch-wiki/version.json` yet): run `arch-wiki adopt --dry-run`,
   show the plan, then `arch-wiki adopt`. It snapshots the curated `.foam/templates/`
   and records a lint baseline so the new deterministic lint won't flood you with
   pre-existing findings.
   **Already-adopted wiki:** run `arch-wiki migrate --dry-run` then `arch-wiki migrate`.
3. Report `from → to` schema, the snapshot/baseline counts, and remind the user to
   review the `git diff` (only new `.arch-wiki/` files) and commit it.
