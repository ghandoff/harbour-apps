import { createHarbourAuth } from "@windedvertigo/auth";

/**
 * Raft-house auth — uses the shared harbour auth package with no
 * app-specific enrichment. Auth is optional — anonymous users can
 * join rooms via room codes, but authenticated users can create
 * rooms and save session history.
 */
const { handlers, auth, signIn, signOut, authConfig } = createHarbourAuth({
  appName: "raft-house",
  allowedEmailDomains: ["windedvertigo.com"],
});

export { handlers, auth, signIn, signOut, authConfig };
