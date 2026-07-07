#!/usr/bin/env node
// Mint a fresh Google OAuth *refresh token* via a localhost consent flow, then
// write it straight into 1Password — the token value never prints to the
// terminal, never goes through an argument list you can see, and never touches
// chat. Companion to rotate-secret.mjs: this GENERATES a new token (the consent
// dance the propagator can't do); rotate-secret.mjs then DISTRIBUTES it to the
// live workers.
//
// Plain-English flow (what actually happens when you run it):
//   1. it reads your OAuth app's id + secret out of 1Password (Touch ID prompt),
//   2. it opens a tiny web server on your own machine (http://localhost:<port>),
//   3. it prints a Google sign-in link — you open it, pick your account, click
//      "Allow". Google sends you back to that localhost server with a one-time
//      code,
//   4. it swaps that code for a long-lived refresh token,
//   5. it saves the refresh token into a 1Password item (Touch ID prompt),
//   6. done — you never see the token; the propagator picks it up from 1Password.
//
// Usage:
//   node scripts/mint-google-token.mjs \
//     --out=GMAIL_REFRESH_TOKEN \
//     --scope="https://www.googleapis.com/auth/gmail.modify" \
//     [--client-id-ref="op://winded.vertigo/GOOGLE_CLIENT_ID/credential"] \
//     [--client-secret-ref="op://winded.vertigo/GOOGLE_CLIENT_SECRET/credential"] \
//     [--vault="winded.vertigo"] [--port=42813]
//
// PREREQUISITES (one-time, you do these — see the chat walkthrough):
//   • 1Password items GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET exist in the
//     vault, each with a field named `credential`.
//   • The OAuth client lists  http://localhost:<port>  as an Authorised redirect
//     URI. The shared SSO client (google-api project, "creaseworks" web client
//     160968051904-ud88…) already registers http://localhost:8080 — the default.

import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    out: { type: "string" },
    scope: { type: "string" },
    "client-id-ref": { type: "string", default: "op://winded.vertigo/GOOGLE_CLIENT_ID/credential" },
    "client-secret-ref": { type: "string", default: "op://winded.vertigo/GOOGLE_CLIENT_SECRET/credential" },
    vault: { type: "string", default: "winded.vertigo" },
    // 8080 is already a registered redirect URI on the shared SSO OAuth client
    // (the "creaseworks" web client, id 160968051904-ud88…) — reusing it means
    // we don't have to modify that production client just to mint a token.
    port: { type: "string", default: "8080" },
    // When set, the minted refresh token is written to this file (0600) instead
    // of straight to 1Password — used so the interactive server can run in the
    // background (where the `op` Touch ID prompt can't surface) and a foreground
    // step does the 1Password write afterwards.
    "token-out-file": { type: "string" },
  },
});

if (!values.out || !values.scope) {
  console.error("usage: node scripts/mint-google-token.mjs --out=<1PasswordItemName> --scope=<googleScopeUrl> [--port=42813]");
  console.error("example: --out=GMAIL_REFRESH_TOKEN --scope=\"https://www.googleapis.com/auth/gmail.modify\"");
  process.exit(1);
}

const PORT = Number(values.port);
const REDIRECT_URI = `http://localhost:${PORT}`;

// ── read the OAuth client id + secret from 1Password (Touch ID) ──────────────
function opRead(ref) {
  try {
    return execFileSync("op", ["read", ref], { encoding: "utf8" }).trim();
  } catch {
    console.error(`  ✗ op read failed for ${ref}`);
    console.error(`    check: 1Password CLI integration is on, the item exists, and Touch ID was approved`);
    process.exit(1);
  }
}

// Credentials come from env vars when present (so a caller can `op read` them in
// a foreground shell where Touch ID works, then launch this server in the
// background), otherwise `op read` directly. Values are never printed.
let clientId = process.env.OAUTH_CLIENT_ID;
let clientSecret = process.env.OAUTH_CLIENT_SECRET;
if (clientId && clientSecret) {
  console.log("  ✓ loaded client id + secret from environment (values not shown)");
} else {
  console.log("reading OAuth client credentials from 1Password (approve Touch ID)…");
  clientId = opRead(values["client-id-ref"]);
  clientSecret = opRead(values["client-secret-ref"]);
  if (!clientId || !clientSecret) {
    console.error("  ✗ client id or secret came back empty");
    process.exit(1);
  }
  console.log("  ✓ loaded client id + secret from 1Password (values not shown)");
}

// ── build the consent URL ────────────────────────────────────────────────────
// access_type=offline + prompt=consent forces Google to return a *refresh*
// token (not just a short-lived access token), even on a re-authorisation.
const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: values.scope,
    access_type: "offline",
    prompt: "consent",
  }).toString();

// ── exchange the one-time code for tokens ────────────────────────────────────
async function exchangeCodeForRefreshToken(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.refresh_token) {
    throw new Error(
      "no refresh_token in response — Google only returns one on first consent. " +
      "Revoke the app's access (myaccount.google.com/connections) and retry, or ensure prompt=consent.",
    );
  }
  return data.refresh_token;
}

// ── write the refresh token into 1Password ───────────────────────────────────
// The value is passed to `op` as an argument (visible to a local `ps` for a
// split second, on your machine only) and is never printed to stdout or chat.
function writeToOnePassword(itemName, refreshToken) {
  const assignment = `credential=${refreshToken}`;
  // does the item already exist?
  let exists = true;
  try {
    execFileSync("op", ["item", "get", itemName, "--vault", values.vault], { stdio: "ignore" });
  } catch {
    exists = false;
  }
  if (exists) {
    execFileSync("op", ["item", "edit", itemName, assignment, "--vault", values.vault], { stdio: ["ignore", "ignore", "inherit"] });
    console.log(`  ✓ updated 1Password item "${itemName}" (credential field)`);
  } else {
    execFileSync(
      "op",
      ["item", "create", "--category", "API Credential", "--title", itemName, "--vault", values.vault, assignment],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    console.log(`  ✓ created 1Password item "${itemName}" (credential field)`);
  }
}

// ── run the loopback flow ────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<h2>authorisation failed: ${err}</h2><p>you can close this tab.</p>`);
    console.error(`  ✗ consent returned an error: ${err}`);
    server.close();
    process.exit(1);
  }
  if (!code) {
    // ignore favicon and other stray requests
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const refreshToken = await exchangeCodeForRefreshToken(code);
    if (values["token-out-file"]) {
      // 0600 = owner read/write only. A foreground step will pick this up,
      // write it into 1Password (Touch ID), then shred the file.
      writeFileSync(values["token-out-file"], refreshToken, { mode: 0o600 });
      console.log(`  ✓ refresh token written to ${values["token-out-file"]} (0600, value not shown)`);
    } else {
      writeToOnePassword(values.out, refreshToken);
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>✓ token minted.</h2><p>you can close this tab and return to the terminal.</p>");
    console.log("\ndone.");
    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h2>token exchange failed</h2><pre>${e.message}</pre>`);
    console.error(`  ✗ ${e.message}`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\nlistening on ${REDIRECT_URI} for the consent redirect.`);
  console.log("\nopen this link in your browser, choose your account, and click Allow:\n");
  console.log(authUrl + "\n");
});
