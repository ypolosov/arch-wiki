#!/usr/bin/env bash
#
# Pre-tag release gate for arch-wiki.
#
# gt feedback P0: an empty/mispointed tag shipped THREE times — the marketplace installs
# by TAG, so a tag left on an old commit (or with a stale dist / un-bumped version) ships
# old code even when `main` is correct, and `claude plugin update` dedupes by the version
# field ("already at X") so the patch silently never installs.
#
# Run from anywhere BEFORE you create/push a release tag. It verifies the three failure
# modes and then prints the exact tag + push + verify commands.
#   (a) version agrees across package.json / plugin.json / src/cli/version.ts (and the arg)
#   (b) dist/cli.cjs is a fresh build of src/ (the runtime bundle is committed, not built on install)
#   (c) HEAD is new code (not the previous tag's commit) + the tag is not silently mispointed
#
# Usage: scripts/release-check.sh [version]   (default version = package.json)

set -euo pipefail
cd "$(dirname "$0")/.."

fail() { echo "release-check: FAIL — $*" >&2; exit 1; }

PKG_V="$(node -p "require('./package.json').version")"
MANIFEST_V="$(node -p "require('./.claude-plugin/plugin.json').version")"
CODE_V="$(node -e "process.stdout.write((require('fs').readFileSync('src/cli/version.ts','utf8').match(/(\d+\.\d+\.\d+)/)||[])[1]||'')")"
WANT="${1:-$PKG_V}"

echo "versions: package.json=$PKG_V plugin.json=$MANIFEST_V version.ts=$CODE_V want=$WANT"
[ "$PKG_V" = "$MANIFEST_V" ] || fail "package.json ($PKG_V) != plugin.json ($MANIFEST_V)"
[ "$PKG_V" = "$CODE_V" ]     || fail "package.json ($PKG_V) != src/cli/version.ts ($CODE_V)"
[ "$PKG_V" = "$WANT" ]       || fail "files say $PKG_V but you asked to release $WANT — bump all three first"

echo "building dist/cli.cjs…"
npm run build >/dev/null
git diff --quiet -- dist/cli.cjs || fail "dist/cli.cjs is STALE — rebuilt output differs from the commit; run 'npm run build' and commit dist/"

echo "running the full test suite…"
npm test || fail "test suite failed — fix before releasing"

TAG="v$WANT"
HEAD_SHA="$(git rev-parse HEAD)"
PREV="$(git tag --list 'v*' --sort=-v:refname | grep -v "^${TAG}$" | head -1 || true)"
if [ -n "$PREV" ]; then
  PREV_SHA="$(git rev-list -n1 "$PREV")"
  [ "$HEAD_SHA" != "$PREV_SHA" ] || fail "HEAD == previous tag $PREV ($PREV_SHA) — nothing new to release"
  echo "previous tag: $PREV ($PREV_SHA)"
fi
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  EXIST_SHA="$(git rev-list -n1 "$TAG")"
  [ "$EXIST_SHA" = "$HEAD_SHA" ] || echo "note: tag $TAG already exists at $EXIST_SHA (≠ HEAD) — you MUST force-move it (-f)"
fi

cat <<EOF

release-check: OK — $TAG is safe to cut at $HEAD_SHA

Cut it (the -f / force flags handle a pre-existing/mispointed tag — the recurring bug):
  git push origin HEAD                       # push the release commit first
  git tag -f -a $TAG -m "Release $TAG" $HEAD_SHA
  git push -f origin $TAG

Then VERIFY before trusting (peeled ^{} must equal $HEAD_SHA; ls-remote is authoritative, raw cache lags ~5 min):
  git ls-remote --tags https://github.com/ypolosov/arch-wiki "$TAG^{}"
  curl -fsSL https://raw.githubusercontent.com/ypolosov/arch-wiki/$TAG/.claude-plugin/plugin.json | grep '"version"'
EOF
