#!/usr/bin/env bash
# ship the pre-built values-auction bundle into the windedvertigo site
# repo at site/public/portfolio/assets/values-auction/, commit, and push.
# wv-site auto-deploys from main on push (Vercel), so the final URL
# https://windedvertigo.com/portfolio/assets/values-auction/ goes live
# ~60-90s after push completes.
#
# run this on a machine that has push access to ghandoff/windedvertigo.
# it does NOT assume you have the repo cloned — it clones into a temp dir.
#
# usage:
#   bash apps/values-auction/scripts/ship-to-portfolio.sh
#   bash apps/values-auction/scripts/ship-to-portfolio.sh --dry-run
#
# the build artifact lives on the `hosted-portfolio` branch of
# ghandoff/harbour-apps and is rebuilt every time the feature branch
# updates (see .github/workflows/deploy-values-auction.yml). this script
# just copies that branch's contents into the site repo and pushes.

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=true; fi

SITE_REPO="git@github.com:ghandoff/windedvertigo.git"
BUILD_REPO="https://github.com/ghandoff/harbour-apps.git"
BUILD_BRANCH="hosted-portfolio"
TARGET_SUBPATH="site/public/portfolio/assets/values-auction"

workdir=$(mktemp -d -t ship-values-auction-XXXXXX)
trap 'rm -rf "$workdir"' EXIT

echo "→ cloning ghandoff/windedvertigo (depth 1)"
git clone --depth 1 "$SITE_REPO" "$workdir/site"

echo "→ cloning harbour-apps hosted-portfolio branch"
git clone --depth 1 --branch "$BUILD_BRANCH" "$BUILD_REPO" "$workdir/build"
rm -rf "$workdir/build/.git"

target="$workdir/site/$TARGET_SUBPATH"
mkdir -p "$(dirname "$target")"
rm -rf "$target"
cp -r "$workdir/build" "$target"

cd "$workdir/site"
if git diff --quiet && git diff --cached --quiet; then
  echo "→ no changes. nothing to ship."
  exit 0
fi

git add "$TARGET_SUBPATH"
git status --short | head

if $DRY_RUN; then
  echo "→ --dry-run: not committing or pushing."
  exit 0
fi

MESSAGE="feat(portfolio): add values-auction interactive demo

hosted at windedvertigo.com/portfolio/assets/values-auction/.
built from ghandoff/harbour-apps@$BUILD_BRANCH with the vite base path
pinned to /portfolio/assets/values-auction/ so asset urls resolve
under the portfolio subdirectory."

git commit -m "$MESSAGE"
git push

echo ""
echo "✓ pushed. vercel will auto-deploy; check:"
echo "   https://windedvertigo.com/portfolio/assets/values-auction/"
echo "   https://windedvertigo.com/portfolio/assets/values-auction/#/facilitate?code=DEMO"
