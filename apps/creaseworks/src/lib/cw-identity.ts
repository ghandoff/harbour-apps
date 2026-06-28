/**
 * cw-identity — the nested, anonymous identity scopes (client-side).
 *
 *   group   — family/class code (localStorage; entered once per device)
 *   player  — the selected avatar (sessionStorage; re-asked each sitting)
 *   device  — random token (localStorage; "this station", NOT a child)
 *   session — random id (sessionStorage; one sitting)
 *
 * The storage tier IS the scope: localStorage persists across sittings,
 * sessionStorage resets each one. The "last player" hint (localStorage)
 * lets a 1:1 device pre-highlight the child while a shared tablet still
 * re-picks — one mechanism, every deployment mode.
 *
 * Roster calls hit the eval worker root-relative (same host, no CORS,
 * mirrors eval-submit). All reads are SSR-safe (return null/"" off-window)
 * and all network calls fail soft — traces and rosters are best-effort.
 */

import type { GroupKind } from "@/lib/eval-server";

const ROSTER_URL = "/harbour/creaseworks-eval/api/eval/roster";

const DEVICE_KEY = "cw-device"; // localStorage
const SESSION_KEY = "cw-session"; // sessionStorage
const GROUP_KEY = "cw-group"; // localStorage  {code, kind}
const PLAYER_KEY = "cw-player"; // sessionStorage {id, avatar}
const LAST_PLAYER_KEY = "cw-last-player"; // localStorage  {id, avatar}

export interface Group {
  code: string;
  kind: GroupKind;
}
export interface Player {
  id: string;
  avatar: string;
}

const hasWindow = () => typeof window !== "undefined";

function rid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function readJson<T>(store: Storage, key: string): T | null {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// ── device + session (auto, anonymous) ───────────────────────────────────

export function getDeviceToken(): string {
  if (!hasWindow()) return "";
  try {
    let t = localStorage.getItem(DEVICE_KEY);
    if (!t) {
      t = rid();
      localStorage.setItem(DEVICE_KEY, t);
    }
    return t;
  } catch {
    return "";
  }
}

export function getSessionId(): string {
  if (!hasWindow()) return "";
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = rid();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "";
  }
}

// ── group (per device) ───────────────────────────────────────────────────

export function getGroup(): Group | null {
  if (!hasWindow()) return null;
  const g = readJson<Group>(localStorage, GROUP_KEY);
  return g && typeof g.code === "string" && (g.kind === "family" || g.kind === "class") ? g : null;
}

export function setGroup(code: string, kind: GroupKind): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(GROUP_KEY, JSON.stringify({ code, kind }));
  } catch {}
}

export function clearGroup(): void {
  if (!hasWindow()) return;
  try {
    localStorage.removeItem(GROUP_KEY);
    // a different group means a different roster — drop the stale selection
    clearSelectedPlayer();
    localStorage.removeItem(LAST_PLAYER_KEY);
  } catch {}
}

// ── selected player (per session) ────────────────────────────────────────

export function getSelectedPlayer(): Player | null {
  if (!hasWindow()) return null;
  const p = readJson<Player>(sessionStorage, PLAYER_KEY);
  return p && typeof p.id === "string" && typeof p.avatar === "string" ? p : null;
}

export function setSelectedPlayer(p: Player): void {
  if (!hasWindow()) return;
  try {
    sessionStorage.setItem(PLAYER_KEY, JSON.stringify(p));
    localStorage.setItem(LAST_PLAYER_KEY, JSON.stringify(p)); // 1:1 convenience
  } catch {}
}

export function clearSelectedPlayer(): void {
  if (!hasWindow()) return;
  try {
    sessionStorage.removeItem(PLAYER_KEY);
  } catch {}
}

/** The last avatar chosen on this device — a hint for 1:1 pre-selection. */
export function getLastPlayer(): Player | null {
  if (!hasWindow()) return null;
  const p = readJson<Player>(localStorage, LAST_PLAYER_KEY);
  return p && typeof p.id === "string" && typeof p.avatar === "string" ? p : null;
}

// ── roster API (fail soft) ───────────────────────────────────────────────

export interface RosterResult {
  exists: boolean;
  kind: GroupKind | null;
  players: Player[];
}

export async function fetchRoster(code: string): Promise<RosterResult> {
  try {
    const res = await fetch(`${ROSTER_URL}?group=${encodeURIComponent(code)}`);
    if (!res.ok) return { exists: false, kind: null, players: [] };
    const body = (await res.json()) as RosterResult;
    return {
      exists: Boolean(body.exists),
      kind: body.kind ?? null,
      players: Array.isArray(body.players) ? body.players : [],
    };
  } catch {
    return { exists: false, kind: null, players: [] };
  }
}

export async function addPlayer(
  code: string,
  kind: GroupKind,
  avatar: string,
): Promise<Player[] | null> {
  try {
    const res = await fetch(ROSTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: code, kind, action: "add", avatar }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { players?: Player[] };
    return Array.isArray(body.players) ? body.players : null;
  } catch {
    return null;
  }
}

export async function removePlayer(code: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(ROSTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: code, action: "remove", id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
