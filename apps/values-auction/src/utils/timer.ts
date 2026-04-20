export interface TickHandle {
  stop(): void;
}

export function startTicker(onTick: (now: number) => void, intervalMs = 250): TickHandle {
  let stopped = false;
  let raf = 0;
  let last = 0;
  const loop = (now: number) => {
    if (stopped) return;
    if (now - last >= intervalMs) {
      last = now;
      onTick(now);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
    },
  };
}

export function formatMs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
