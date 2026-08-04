#!/bin/bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-./deploy}"
APP_IMAGE="${APP_IMAGE:-registry.redhat.io/rhdh/rhdh-hub-rhel9:1.10}"
APP_CONFIG="${APP_CONFIG:-./app-config.podman.yaml}"
DYNAMIC_PLUGINS_CONFIG="${DYNAMIC_PLUGINS_CONFIG:-./dynamic-plugins.podman.yaml}"
CONTAINER_NAME="${CONTAINER_NAME:-rhdh-dev}"
PORT="${PORT:-7007}"
ENV_FILE="${ENV_FILE:-.env}"
SKIP_BUILD="${SKIP_BUILD:-false}"

podman rm -f "$CONTAINER_NAME" 2>/dev/null || true

if [ "$SKIP_BUILD" != "true" ]; then
  if [ ! -d "$DEPLOY_DIR" ] || [ -z "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]; then
    echo "No plugins found in $DEPLOY_DIR. Building and exporting..."
    yarn build
    ./node_modules/.bin/rhdh-cli plugin package --export-to "$DEPLOY_DIR"
  fi
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

MOUNT_ARGS=()
MOUNT_ARGS+=(-v "$(realpath "$DEPLOY_DIR"):/opt/app-root/src/local-plugins:Z")
MOUNT_ARGS+=(-v "$(realpath "$APP_CONFIG"):/opt/app-root/src/app-config.yaml:Z")

if [ -f "$DYNAMIC_PLUGINS_CONFIG" ]; then
  echo "Dynamic plugins config: $DYNAMIC_PLUGINS_CONFIG"
  MOUNT_ARGS+=(-v "$(realpath "$DYNAMIC_PLUGINS_CONFIG"):/opt/app-root/src/dynamic-plugins.yaml:Z")
fi

podman run --rm \
  --name "$CONTAINER_NAME" \
  "${ENV_ARGS[@]}" \
  "${MOUNT_ARGS[@]}" \
  -p "$PORT:7007" \
  --entrypoint='["bash", "-c", "./install-dynamic-plugins.sh /opt/app-root/src/dynamic-plugins-root && node packages/backend --config app-config.yaml --config dynamic-plugins-root/app-config.dynamic-plugins.yaml"]' \
  "$APP_IMAGE"
