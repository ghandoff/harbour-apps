// single source of truth for the app's base path.
// in local dev this is empty (serves at `/`); in production it's
// `/harbour/co-rubric`, baked in at build time via next.config.ts.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiPath(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalised}`;
}
