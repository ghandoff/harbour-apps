// returns an absolute url for a public asset, respecting the vite base path.
// use this whenever a template constructs an asset url at runtime
// (hardcoded `/logos/x.svg` breaks when the app is served from a subpath).
export function asset(path: string): string {
  const base = (import.meta as any).env?.BASE_URL ?? '/';
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${trimmed}`;
}
