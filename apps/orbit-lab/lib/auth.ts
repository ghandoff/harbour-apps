import { createHarbourAuth } from "@windedvertigo/auth";

const { handlers, auth, signIn, signOut, authConfig } = createHarbourAuth({
  appName: "orbit-lab",
  allowedEmailDomains: ["windedvertigo.com"],
});

export { handlers, auth, signIn, signOut, authConfig };
