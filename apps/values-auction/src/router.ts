export type RoutePath = 'join' | 'facilitate' | 'wall';

export interface Route {
  path: RoutePath;
  code: string;
}

export function parseRoute(hash: string): Route {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const [p, query] = clean.split('?');
  const path = (p.startsWith('/') ? p.slice(1) : p) as RoutePath;
  const params = new URLSearchParams(query ?? '');
  const code = params.get('code') ?? 'DEMO';
  const valid: RoutePath[] = ['join', 'facilitate', 'wall'];
  return { path: valid.includes(path) ? path : 'join', code };
}

export function subscribeRoute(fn: (r: Route) => void): () => void {
  const handler = () => fn(parseRoute(location.hash));
  window.addEventListener('hashchange', handler);
  handler();
  return () => window.removeEventListener('hashchange', handler);
}
