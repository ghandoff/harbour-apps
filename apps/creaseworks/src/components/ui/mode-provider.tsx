"use client";

/**
 * ModeProvider — kid / grown-up presentation mode context.
 *
 * Mirrors the accessibility prefs pattern: cookie → html class → CSS.
 * For unauthenticated users, mode is stored in localStorage + cookie.
 * For authenticated users, it's persisted via /api/preferences.
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type UiMode = "kid" | "grownup";

interface ModeContextValue {
  mode: UiMode;
  isKidMode: boolean;
  toggleMode: () => void;
  setMode: (m: UiMode) => void;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "grownup",
  isKidMode: false,
  toggleMode: () => {},
  setMode: () => {},
});

export function useMode() {
  return useContext(ModeContext);
}

function applyModeClass(mode: UiMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("kid-mode", mode === "kid");
}

function setCookie(mode: UiMode) {
  if (typeof document === "undefined") return;
  document.cookie = `cw-ui-mode=${mode};path=/harbour/creaseworks;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function ModeProvider({
  initialMode = "grownup",
  children,
}: {
  initialMode?: UiMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<UiMode>(initialMode);

  const setMode = useCallback((m: UiMode) => {
    setModeState(m);
    applyModeClass(m);
    setCookie(m);

    // persist to server (best-effort, don't block UI)
    fetch("/harbour/creaseworks/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uiMode: m }),
    }).catch(() => {
      // unauthenticated users — cookie is sufficient
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "kid" ? "grownup" : "kid");
  }, [mode, setMode]);

  return (
    <ModeContext.Provider
      value={{ mode, isKidMode: mode === "kid", toggleMode, setMode }}
    >
      {children}
    </ModeContext.Provider>
  );
}
