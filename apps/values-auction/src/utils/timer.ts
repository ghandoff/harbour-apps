export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function tick(fn: (now: number) => void, intervalMs = 250): () => void {
  const id = setInterval(() => fn(Date.now()), intervalMs);
  fn(Date.now());
  return () => clearInterval(id);
}
