import { createAuthRouteHandler } from "@windedvertigo/auth/route-handler";
import { authConfig } from "@/lib/auth";

// Empty appName matches `lib/auth.ts` — the hub mounts at /harbour, not
// /harbour/<sub>. The shared route handler treats empty appName as
// basePath = "/harbour" (no trailing sub-path).
//
// Pin the canonical auth origin to the APEX host. The worker's AUTH_URL
// secret carries `www.windedvertigo.com`, which forced every auth request
// onto `www` — but users reach the hub at the apex `windedvertigo.com`, and
// the shared Google OAuth client's redirect URIs are registered on the apex
// like the other Pool A apps. Normalising onto `www` sent magic-link emails
// (and OAuth redirect_uris) to a host that didn't match what was used, so
// sign-in surfaced "something went wrong". Apex matches creaseworks, vault,
// and depth-chart.
const { GET, POST } = createAuthRouteHandler("", authConfig, {
  authUrl: "https://windedvertigo.com/harbour/api/auth",
});
export { GET, POST };
