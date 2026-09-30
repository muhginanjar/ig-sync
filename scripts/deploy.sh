#!/usr/bin/env bash
# Deploy on the server: bash scripts/deploy.sh  (or: npm run deploy)
#
# Everything lives inside main() so bash reads the whole file before running;
# `git pull` below may replace this very script mid-run.
set -euo pipefail

main() {
  cd "$(dirname "$0")/.."

  # The server should only run what's in git. Stray edits (usually
  # package-lock.json after an `npm install`) are stashed, not thrown away.
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "▶ Perubahan lokal di server, disimpan ke git stash:"
    git status --short --untracked-files=no
    git stash push -m "deploy-auto $(date '+%F %T')"
  fi

  echo "▶ git pull"
  git pull --ff-only

  echo "▶ npm ci"
  npm ci

  echo "▶ build"
  npm run build

  echo "▶ migrate database"
  npm run db:migrate

  echo "▶ restart web"
  if pm2 describe ig-sync-web > /dev/null 2>&1; then
    pm2 reload ig-sync-web
  else
    pm2 start ecosystem.config.cjs
    pm2 save
  fi

  echo "✔ Deploy selesai: $(git log -1 --format='%h %s')"
  if [ -n "$(git stash list)" ]; then
    echo "ℹ Ada perubahan tersimpan di stash (lihat: git stash list)."
  fi
}

main "$@"
