#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/home/user/vibeathon-platform}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"
git fetch origin "$BRANCH"
current="$(git rev-parse HEAD)"
target="$(git rev-parse "origin/$BRANCH")"

if [ "$current" = "$target" ] && docker compose ps --status running app | grep -q app; then
  exit 0
fi

git reset --hard "origin/$BRANCH"
docker compose build app
docker compose run --rm migrate sh -c 'npx prisma db push && npx prisma db seed' 2>&1 || true
# Force recreate so the new image is always picked up (compose can otherwise
# keep the old container running when it can't detect the image change).
docker compose up -d --force-recreate app
docker image prune -f >/dev/null
