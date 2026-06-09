#!/bin/sh
set -eu

timestamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p backups
docker compose exec -T db pg_dump \
  -U "${POSTGRES_USER:-vibeathon}" \
  -d "${POSTGRES_DB:-vibeathon}" \
  -Fc > "backups/vibeathon-${timestamp}.dump"
echo "Backup written to backups/vibeathon-${timestamp}.dump"
