#!/bin/bash
# Vercel install script for subdirectory deploys.
#
# Problem: Vercel uploads only the app subdirectory, so workspace
# packages (@windedvertigo/*) can't be resolved by npm install.
#
# Solution: Strip workspace deps before npm install, then copy the
# actual package sources from the repo (checked into this directory
# as a snapshot) into node_modules so the build resolves them.

set -e

# 1. Remove all @windedvertigo/* workspace deps from package.json
node -e "
  const p = require('./package.json');
  for (const key of Object.keys(p.dependencies || {})) {
    if (key.startsWith('@windedvertigo/')) delete p.dependencies[key];
  }
  require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));
"

# 2. Install public dependencies
npm install

# 3. Copy workspace package snapshots into node_modules
if [ -d "scripts/workspace-stubs" ]; then
  cp -r scripts/workspace-stubs/@windedvertigo node_modules/@windedvertigo
fi
