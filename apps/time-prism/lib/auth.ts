import { createHarbourAuth } from "@windedvertigo/auth";

const { handlers, auth, signIn, signOut, authConfig } = createHarbourAuth({
  appName: "time-prism",
  allowedEmailDomains: ["windedvertigo.com"],
});

export { handlers, auth, signIn, signOut, authConfig };
