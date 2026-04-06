#!/bin/bash
# Vercel install script for subdirectory deploys.
# Strips workspace dependencies from package.json, runs npm install,
# then creates stub packages so the build can resolve imports.

set -e

# 1. Remove ALL @windedvertigo/* workspace deps and run npm install
node -e "
  const p = require('./package.json');
  for (const key of Object.keys(p.dependencies || {})) {
    if (key.startsWith('@windedvertigo/')) delete p.dependencies[key];
  }
  require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));
"
npm install

# 2. Create stub packages so Next.js build can resolve imports.
#    Each stub has .js + .d.ts for every export path.

stub() {
  local pkg=$1 name=$2
  mkdir -p "node_modules/@windedvertigo/$pkg"
  shift 2
  # build exports map
  local exports='".":'
  exports="{ \".\": { \"types\": \"./index.d.ts\", \"default\": \"./index.js\" }"
  for entry in "$@"; do
    exports="$exports, \"./$entry\": { \"types\": \"./$entry.d.ts\", \"default\": \"./$entry.js\" }"
  done
  exports="$exports }"

  cat > "node_modules/@windedvertigo/$pkg/package.json" << EOF
{ "name": "@windedvertigo/$pkg", "version": "0.0.0-stub", "exports": $exports }
EOF

  # index stub
  echo "module.exports = {};" > "node_modules/@windedvertigo/$pkg/index.js"
  echo "export {}; export declare const _stub: any;" > "node_modules/@windedvertigo/$pkg/index.d.ts"

  # sub-path stubs
  for entry in "$@"; do
    echo "module.exports = {};" > "node_modules/@windedvertigo/$pkg/$entry.js"
    echo "export {}; export declare const _stub: any;" > "node_modules/@windedvertigo/$pkg/$entry.d.ts"
  done
}

# ── @windedvertigo/auth ──────────────────────────────────────────
stub auth auth route-handler types harbour-nav
# provide named exports used in raft-house code
cat > node_modules/@windedvertigo/auth/index.js << 'STUB'
module.exports.createHarbourAuth = () => ({ auth: async () => null, signIn: async () => {}, signOut: async () => {} });
module.exports.authConfig = {};
STUB
cat > node_modules/@windedvertigo/auth/index.d.ts << 'STUB'
export function createHarbourAuth(...args: any[]): any;
export const authConfig: any;
STUB
cat > node_modules/@windedvertigo/auth/route-handler.js << 'STUB'
module.exports.createAuthRouteHandler = () => ({ GET: async () => new Response(), POST: async () => new Response() });
STUB
cat > node_modules/@windedvertigo/auth/route-handler.d.ts << 'STUB'
export function createAuthRouteHandler(...args: any[]): { GET: any; POST: any };
STUB
cat > node_modules/@windedvertigo/auth/types.d.ts << 'STUB'
export {};
declare module "next-auth" { interface Session { user: any } }
STUB
cat > node_modules/@windedvertigo/auth/harbour-nav.js << 'STUB'
const React = require("react"); module.exports.HarbourNav = () => null;
STUB
cat > node_modules/@windedvertigo/auth/harbour-nav.d.ts << 'STUB'
export function HarbourNav(props: any): any;
STUB

# ── @windedvertigo/stripe ────────────────────────────────────────
stub stripe stripe webhook
cat > node_modules/@windedvertigo/stripe/index.js << 'STUB'
module.exports.createHarbourCheckout = async () => ({ url: "" });
module.exports.checkEntitlement = async () => false;
STUB
cat > node_modules/@windedvertigo/stripe/index.d.ts << 'STUB'
export function createHarbourCheckout(...args: any[]): Promise<{ url: string }>;
export function checkEntitlement(...args: any[]): Promise<boolean>;
STUB
cat > node_modules/@windedvertigo/stripe/webhook.js << 'STUB'
module.exports.handleStripeWebhook = async () => new Response();
STUB
cat > node_modules/@windedvertigo/stripe/webhook.d.ts << 'STUB'
export function handleStripeWebhook(...args: any[]): Promise<Response>;
STUB

# ── @windedvertigo/feedback ──────────────────────────────────────
stub feedback feedback api-handler
cat > node_modules/@windedvertigo/feedback/index.js << 'STUB'
const React = require("react"); module.exports.FeedbackWidget = () => null;
STUB
cat > node_modules/@windedvertigo/feedback/index.d.ts << 'STUB'
export function FeedbackWidget(props: any): any;
STUB
cat > node_modules/@windedvertigo/feedback/api-handler.js << 'STUB'
module.exports.createFeedbackHandler = () => async () => new Response();
STUB
cat > node_modules/@windedvertigo/feedback/api-handler.d.ts << 'STUB'
export function createFeedbackHandler(...args: any[]): any;
STUB
