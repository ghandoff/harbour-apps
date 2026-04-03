#!/bin/bash
# Vercel install script for subdirectory deploys.
# Strips workspace dependencies from package.json, runs npm install,
# then creates stub packages so the build can resolve imports.

set -e

# 1. Remove workspace deps from package.json so npm install doesn't
#    try to resolve them from the public registry
node -e "
  const p = require('./package.json');
  delete p.dependencies['@windedvertigo/auth'];
  delete p.dependencies['@windedvertigo/stripe'];
  require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));
"

# 2. Install all remaining (public) dependencies
npm install

# 3. Create stub packages for workspace deps so Next.js build can
#    resolve the imports. These are no-op implementations — the real
#    packages are linked via npm workspaces in local development.

# ── @windedvertigo/auth ──────────────────────────────────────────
mkdir -p node_modules/@windedvertigo/auth
cat > node_modules/@windedvertigo/auth/package.json << 'STUB'
{
  "name": "@windedvertigo/auth",
  "version": "0.0.0-stub",
  "exports": {
    ".": { "types": "./index.d.ts", "default": "./index.js" },
    "./route-handler": { "types": "./route-handler.d.ts", "default": "./route-handler.js" },
    "./types": { "types": "./types.d.ts", "default": "./types.js" },
    "./harbour-nav": { "types": "./harbour-nav.d.ts", "default": "./harbour-nav.js" }
  }
}
STUB

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

cat > node_modules/@windedvertigo/auth/types.js << 'STUB'
module.exports = {};
STUB
cat > node_modules/@windedvertigo/auth/types.d.ts << 'STUB'
export {};
declare module "next-auth" { interface Session { user: any } }
STUB

cat > node_modules/@windedvertigo/auth/harbour-nav.js << 'STUB'
module.exports.HarbourNav = () => null;
STUB
cat > node_modules/@windedvertigo/auth/harbour-nav.d.ts << 'STUB'
export function HarbourNav(props: any): any;
STUB

# ── @windedvertigo/stripe ────────────────────────────────────────
mkdir -p node_modules/@windedvertigo/stripe
cat > node_modules/@windedvertigo/stripe/package.json << 'STUB'
{
  "name": "@windedvertigo/stripe",
  "version": "0.0.0-stub",
  "exports": {
    ".": { "types": "./index.d.ts", "default": "./index.js" },
    "./webhook": { "types": "./webhook.d.ts", "default": "./webhook.js" }
  }
}
STUB

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
