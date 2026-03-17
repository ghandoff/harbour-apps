"use client";

/**
 * useTimer — drift-corrected countdown hook.
 *
 * Uses Date.now() anchoring instead of naive setInterval to survive
 * mobile tab backgrounding. The number shown is always wall-clock
 * accurate when the kid returns to the tab.
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface UseTimerReturn {
  /** seconds remaining (clamped to 0) */
  timeLeft: number;
  /** true while counting down */
  isRunning: boolean;
  /** start the countdown */
  start: () => void;
  /** reset to initial duration */
  reset: () => void;
}

export function useTimer(
  durationSeconds: number,
  onExpire: () => void,
): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const tick = useCallback(() => {
    if (startedAtRef.current === null) return;

    const elapsed = (Date.now() - startedAtRef.current) / 1000;
    const remaining = Math.max(0, durationSeconds - Math.floor(elapsed));

    setTimeLeft(remaining);

    if (remaining <= 0) {
      setIsRunning(false);
      startedAtRef.current = null;
      onExpireRef.current();
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      /* throttle to ~4 checks/sec instead of every frame */
      setTimeout(() => tick(), 250);
    });
  }, [durationSeconds]);

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    setIsRunning(true);
    setTimeLeft(durationSeconds);
    tick();
  }, [durationSeconds, tick]);

  const reset = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startedAtRef.current = null;
    setIsRunning(false);
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { timeLeft, isRunning, start, reset };
}
