#!/bin/bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-./deploy}"

for plugin_dir in plugins/*/; do
  plugin_name=$(basename "$plugin_dir")
  dist_dir="$plugin_dir/dist-dynamic"
  [ ! -d "$dist_dir" ] && continue

  newest_src=$(find "$plugin_dir/src" -name '*.ts' -o -name '*.tsx' 2>/dev/null | xargs stat -c '%Y' 2>/dev/null | sort -rn | head -1)
  newest_dist=$(stat -c '%Y' "$dist_dir/package.json" 2>/dev/null || echo 0)

  if [ "${newest_src:-0}" -gt "${newest_dist:-0}" ]; then
    echo "$(date '+%H:%M:%S') [watch] $plugin_name changed — cleaning dist"
    rm -rf "$plugin_dir/dist" "$plugin_dir/dist-dynamic" "$plugin_dir/dist-types"
  fi
done

echo "$(date '+%H:%M:%S') [watch] Building..."
yarn build 2>&1 | tail -3

echo "$(date '+%H:%M:%S') [watch] Exporting plugins..."
rm -rf "$DEPLOY_DIR"
./node_modules/.bin/rhdh-cli plugin package --export-to "$DEPLOY_DIR" 2>&1 | tail -3

echo "$(date '+%H:%M:%S') [watch] Restarting container..."
SKIP_BUILD=true ./run-with-podman.sh
