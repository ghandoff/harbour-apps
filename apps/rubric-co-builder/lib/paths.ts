export const BASE_PATH = "/harbour/rubric-co-builder";

export function apiPath(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalised}`;
}
