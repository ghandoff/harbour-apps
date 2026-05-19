import { createHarbourAuth } from "@windedvertigo/auth";

const { handlers, auth, signIn, signOut, authConfig } = createHarbourAuth({
  appName: "pattern-weave",
  allowedEmailDomains: ["windedvertigo.com"],
});

export { handlers, auth, signIn, signOut, authConfig };
