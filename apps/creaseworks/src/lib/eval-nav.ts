/**
 * creaseworks eval — clean-URL helper (mirrors miniHref).
 *
 * In the CW_EVAL build the /eval surfaces are served at the basePath
 * root (see next.config.ts rewrites), so links should omit the /eval
 * tail. In any other flavour (local dev, prod) the pages live under
 * /eval/* and the helper emits the real path.
 *
 * basePath is auto-prepended by <Link>/router — never include it here.
 */

export const EVAL_AT_ROOT = process.env.NEXT_PUBLIC_CW_EVAL === "1";

export function evalHref(path: "" | `/${string}`): string {
  return EVAL_AT_ROOT ? path || "/" : `/eval${path}`;
}
