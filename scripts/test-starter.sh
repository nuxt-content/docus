#!/usr/bin/env bash
# Packs the layer like `npm publish` would, installs it in a fresh copy of a starter, then builds and typechecks it.
# Usage: scripts/test-starter.sh <default|i18n>
# - `NITRO_PRESET` defaults to `vercel`, the output is then checked with `check-vercel-output.mts`.
# - `WORKDIR` sets where the app is created and keeps it, a temporary folder is used otherwise.
# - `SKIP_TYPECHECK=1` stops after the build.
set -euo pipefail

starter="${1:?Usage: scripts/test-starter.sh <default|i18n>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
export NITRO_PRESET="${NITRO_PRESET:-vercel}"

if [ -n "${WORKDIR:-}" ]; then
  work="$WORKDIR"
  if [ -e "$work/app" ]; then
    echo "$work/app already exists, remove it or pick another WORKDIR" >&2
    exit 1
  fi
  mkdir -p "$work"
else
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT
fi

echo "› Packing the docus layer"
pnpm --dir "$root/layer" pack --pack-destination "$work" > /dev/null
tarball="$(ls "$work"/docus-*.tgz)"

echo "› Copying .starters/$starter to $work/app"
# Local leftovers from `nuxt dev` in the starter must not leak into the test.
rsync -a \
  --exclude node_modules --exclude .nuxt --exclude .output --exclude .data --exclude .vercel \
  --exclude pnpm-lock.yaml --exclude pnpm-workspace.yaml \
  "$root/.starters/$starter/" "$work/app/"
cd "$work/app"

echo "› Installing the packed layer"
npm pkg set "dependencies.docus=file:$tarball"
npm install --no-audit --no-fund
npm install --save-dev --no-audit --no-fund typescript vue-tsc

echo "› Building with the $NITRO_PRESET preset"
npx nuxt build

if [ "$NITRO_PRESET" = "vercel" ]; then
  node "$root/scripts/check-vercel-output.mts" .
fi

if [ -z "${SKIP_TYPECHECK:-}" ]; then
  echo "› Typechecking"
  npx nuxt typecheck
fi
