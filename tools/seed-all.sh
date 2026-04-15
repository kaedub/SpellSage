#!/usr/bin/env bash
# Run full DB seed in dependency order (env-driven paths via package.json scripts).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> seed:bulk (bulk cards)"
yarn seed:bulk

echo "==> seed:keywords"
yarn seed:keywords

echo "==> seed:tag-taxonomy"
yarn seed:tag-taxonomy

echo "==> seed:oracle-card-tags"
yarn seed:oracle-card-tags

echo "==> seed:collection"
yarn seed:collection

echo "==> All seed steps finished."
