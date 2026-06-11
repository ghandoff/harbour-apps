/**
 * Prefix an API path with the Next.js basePath so client-side `fetch()` calls
 * reach the correct Vercel deployment under the `/harbour/creaseworks` prefix.
 *
 * Next.js automatically prepends `basePath` to `<Link>`, `router.push()`, and
 * `<Image>` URLs, but plain `fetch()` calls are raw browser requests that need
 * the prefix applied manually.
 *
 * Usage:
 *   fetch(apiUrl("/api/matcher"), { method: "POST", ... })
 */
// flavour-aware: the CW_MINI build mounts at /harbour/creaseworks-mini
const BASE_PATH =
  process.env.NEXT_PUBLIC_CW_MINI === "1"
    ? "/harbour/creaseworks-mini"
    : "/harbour/creaseworks";

export function apiUrl(path: string): string {
  // Avoid double-prefixing if the path already starts with basePath
  if (path.startsWith(BASE_PATH)) return path;
  return `${BASE_PATH}${path}`;
}
