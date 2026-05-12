#!/bin/bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-./deploy}"
APP_IMAGE="${APP_IMAGE:-registry.redhat.io/rhdh/rhdh-hub-rhel9:1.9}"
APP_CONFIG="${APP_CONFIG:-./app-config.podman.yaml}"
PORT="${PORT:-7007}"
ENV_FILE="${ENV_FILE:-.env}"

if [ ! -d "$DEPLOY_DIR" ] || [ -z "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]; then
  echo "No plugins found in $DEPLOY_DIR. Building and exporting..."
  yarn build
  ./node_modules/.bin/rhdh-cli plugin package --export-to "$DEPLOY_DIR"
fi

echo "Starting RHDH with plugins from $DEPLOY_DIR"
echo "App image: $APP_IMAGE"
echo "Config: $APP_CONFIG"
echo "Port: $PORT"

ENV_ARGS=()
ENV_ARGS+=(-e LOG_LEVEL=info)
ENV_ARGS+=(-e ENABLE_AUTH_PROVIDER_MODULE_OVERRIDE=true)

if [ -f "$ENV_FILE" ]; then
  echo "Loading env vars from $ENV_FILE"
  ENV_ARGS+=(--env-file "$ENV_FILE")
fi

podman run --rm \
  "${ENV_ARGS[@]}" \
  -v "$(realpath "$DEPLOY_DIR"):/opt/app-root/src/dynamic-plugins-root:Z" \
  -v "$(realpath "$APP_CONFIG"):/opt/app-root/src/app-config.yaml:Z" \
  -p "$PORT:7007" \
  --entrypoint='["node", "packages/backend", "--config", "app-config.yaml"]' \
  "$APP_IMAGE"
