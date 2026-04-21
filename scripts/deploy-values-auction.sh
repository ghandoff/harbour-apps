#!/usr/bin/env bash
# Deploy the values-auction Vercel project from the monorepo root.
#
# Matches the pattern used by the 17 sibling deploy scripts
# (deploy-harbour.sh, deploy-paper-trail.sh, etc). Temporarily swaps
# .vercel/project.json to target values-auction, deploys, restores.
#
# First-time setup (once per machine):
#   cd apps/values-auction && vercel link
#     → pick scope: winded.vertigo team
#     → link to existing? no — create a new project
#     → name: values-auction
#     → directory: ./
#   grab the project ID from apps/values-auction/.vercel/project.json
#   and paste it into VALUES_AUCTION_PROJECT_ID below.
#
# Usage:
#   ./scripts/deploy-values-auction.sh            # production deploy
#   ./scripts/deploy-values-auction.sh --preview  # preview deploy

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERCEL_DIR="$REPO_ROOT/.vercel"
PROJECT_JSON="$VERCEL_DIR/project.json"
BACKUP_JSON="$VERCEL_DIR/project.json.bak"

# TODO: fill in after the first `vercel link` creates the project.
VALUES_AUCTION_PROJECT_ID="${VALUES_AUCTION_PROJECT_ID:-REPLACE_ME}"
VALUES_AUCTION_ORG_ID="team_wrpRda7ZzXdu7nKcEVVXY3th"

if [[ "$VALUES_AUCTION_PROJECT_ID" == "REPLACE_ME" ]]; then
  echo "✗ VALUES_AUCTION_PROJECT_ID not set."
  echo "  run 'cd apps/values-auction && vercel link' once, then paste the"
  echo "  projectId from apps/values-auction/.vercel/project.json into this"
  echo "  script (or export VALUES_AUCTION_PROJECT_ID=prj_... before running)."
  exit 1
fi

DEPLOY_FLAGS="--prod"
if [[ "${1:-}" == "--preview" ]]; then
  DEPLOY_FLAGS=""
fi

mkdir -p "$VERCEL_DIR"

echo "→ Swapping .vercel/project.json to target values-auction"
if [[ -f "$PROJECT_JSON" ]]; then
  cp "$PROJECT_JSON" "$BACKUP_JSON"
fi

cleanup() {
  if [[ -f "$BACKUP_JSON" ]]; then
    echo "→ Restoring .vercel/project.json"
    mv "$BACKUP_JSON" "$PROJECT_JSON"
  fi
}
trap cleanup EXIT

printf '{"projectId":"%s","orgId":"%s","projectName":"values-auction"}\n' \
  "$VALUES_AUCTION_PROJECT_ID" "$VALUES_AUCTION_ORG_ID" > "$PROJECT_JSON"

echo "→ Deploying apps/values-auction (vite static build, basePath /harbour/values-auction/)"
cd "$REPO_ROOT"
vercel deploy $DEPLOY_FLAGS --cwd apps/values-auction
