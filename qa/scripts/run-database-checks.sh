#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTAINER_NAME="${1:-demo-postgres}"

docker exec -i "$CONTAINER_NAME" \
  psql -U postgres -d demo_app -v ON_ERROR_STOP=1 \
  < "$ROOT_DIR/qa/database/assert-integrity.sql"
