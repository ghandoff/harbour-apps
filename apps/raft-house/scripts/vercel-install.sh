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

# @windedvertigo/auth
mkdir -p node_modules/@windedvertigo/auth
cat > node_modules/@windedvertigo/auth/package.json << 'STUB'
{
  "name": "@windedvertigo/auth",
  "version": "0.0.0-stub",
  "exports": {
    ".": "./index.js",
    "./route-handler": "./route-handler.js",
    "./types": "./types.js",
    "./harbour-nav": "./harbour-nav.js"
  }
}
STUB
cat > node_modules/@windedvertigo/auth/index.js << 'STUB'
module.exports.createHarbourAuth = () => ({ auth: async () => null, signIn: async () => {}, signOut: async () => {} });
module.exports.authConfig = {};
STUB
cat > node_modules/@windedvertigo/auth/route-handler.js << 'STUB'
module.exports.createAuthRouteHandler = () => ({ GET: async () => new Response(), POST: async () => new Response() });
STUB
cat > node_modules/@windedvertigo/auth/types.js << 'STUB'
module.exports = {};
STUB
cat > node_modules/@windedvertigo/auth/harbour-nav.js << 'STUB'
module.exports.HarbourNav = () => null;
STUB

# @windedvertigo/stripe
mkdir -p node_modules/@windedvertigo/stripe
cat > node_modules/@windedvertigo/stripe/package.json << 'STUB'
{
  "name": "@windedvertigo/stripe",
  "version": "0.0.0-stub",
  "exports": {
    ".": "./index.js",
    "./webhook": "./webhook.js"
  }
}
STUB
cat > node_modules/@windedvertigo/stripe/index.js << 'STUB'
module.exports.createHarbourCheckout = async () => ({ url: "" });
module.exports.checkEntitlement = async () => false;
STUB
cat > node_modules/@windedvertigo/stripe/webhook.js << 'STUB'
module.exports.handleStripeWebhook = async () => new Response();
STUB
