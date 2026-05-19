import { createHarbourAuth } from "@windedvertigo/auth";

const { handlers, auth, signIn, signOut, authConfig } = createHarbourAuth({
  appName: "proof-garden",
  allowedEmailDomains: ["windedvertigo.com"],
});

export { handlers, auth, signIn, signOut, authConfig };
