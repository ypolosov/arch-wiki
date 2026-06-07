---
description: Sync the plugin's canonical templates into the target .foam/templates — one-way and non-destructive.
argument-hint: "[--force] [--dry-run]"
allowed-tools: Bash(arch-wiki:*)
---

Bring `docs/architecture/.foam/templates/` in line with the plugin's canonical
templates. The sync is **one-way** (plugin → target) and **never overwrites a
curated template** (one you authored — it has no arch-wiki origin marker). Args:
`$ARGUMENTS`

1. Check drift (pre-approved): `arch-wiki sync-templates`. It classifies each
   template as `synced` / `missing` / `stale` (arch-wiki-managed, plugin updated) /
   `curated` (yours — preserved) and exits 2 if anything is missing or stale.
2. To apply: `arch-wiki sync-templates --force`. It creates missing templates and
   updates stale ones (backing up the old copy as `*.bak`); curated files are left
   untouched. Use `--dry-run` to preview without writing or failing.
3. Report what changed and remind the user that to replace a curated template they
   should delete it first, then re-run with `--force`.
