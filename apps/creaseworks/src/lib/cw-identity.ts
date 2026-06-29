/**
 * cw-identity — the nested, anonymous identity scopes (client-side).
 *
 *   group        — the ONE family/class code (= the family code from
 *                  mini-pilot's saveCode; localStorage `cw-group` mirrors it
 *                  with the cohort kind). Set once the code is validated.
 *   child player — the selected kid avatar (sessionStorage; the within-child
 *                  key, re-asked each sitting via "who's playing?")
 *   adult        — the selected grown-up avatar (sessionStorage; "who's the
 *                  grown-up today?" — multiple parents/teachers across sessions)
 *   device       — random token (localStorage; "this station", NOT a child)
 *   session      — random id (sessionStorage; one sitting)
 *
 * One code: the family code (cw-mini-code) and the roster group code are the
 * same value — the grown-up corner sets both when the code validates, so
 * sharing, the avatar roster, and behavioural traces all key off it. Storage
 * tier = scope (localStorage persists, sessionStorage resets per sitting).
 *
 * Roster calls hit the eval worker root-relative (same host, no CORS). All
 * reads are SSR-safe; network calls fail soft.
 */

import type { GroupKind } from "@/lib/eval-server";
export type { GroupKind };

const ROSTER_URL = "/harbour/creaseworks-eval/api/eval/roster";

const DEVICE_KEY = "cw-device"; // localStorage
const SESSION_KEY = "cw-session"; // sessionStorage
const GROUP_KEY = "cw-group"; // localStorage  {code, kind}
const CODE_KEY = "cw-mini-code"; // localStorage — the family code (shared w/ mini-pilot saveCode)
const PLAYER_KEY = "cw-player"; // sessionStorage {id, avatar} — the child
const LAST_PLAYER_KEY = "cw-last-player"; // localStorage {id, avatar}
const ADULT_KEY = "cw-adult"; // sessionStorage {id, avatar} — the grown-up
const LAST_ADULT_KEY = "cw-last-adult"; // localStorage {id, avatar}

export type PlayerKind = "child" | "adult";

export interface Group {
  code: string;
  kind: GroupKind;
}
export interface Player {
  id: string;
  avatar: string;
  kind?: PlayerKind; // defaults to child (back-compat with pre-v5 rows)
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

// ── group = the one family/class code (per device) ───────────────────────

export function getGroup(): Group | null {
  if (!hasWindow()) return null;
  const g = readJson<Group>(localStorage, GROUP_KEY);
  return g && typeof g.code === "string" && (g.kind === "family" || g.kind === "class") ? g : null;
}

/**
 * Bind the validated family/class code as the single identity. Writes both
 * the roster group (cw-group) and the family code (cw-mini-code) so sharing
 * + roster + traces share one value. The grown-up corner calls this when the
 * code validates; the roster setup may re-call it to flip the cohort kind.
 */
export function setGroup(code: string, kind: GroupKind): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(GROUP_KEY, JSON.stringify({ code, kind }));
    localStorage.setItem(CODE_KEY, code);
  } catch {}
}

export function clearGroup(): void {
  if (!hasWindow()) return;
  try {
    localStorage.removeItem(GROUP_KEY);
    localStorage.removeItem(CODE_KEY);
    document.cookie = "cw-mini-code=; path=/; max-age=0; SameSite=Lax";
    // a different code means a different roster — drop stale selections
    clearSelectedPlayer();
    clearSelectedAdult();
    localStorage.removeItem(LAST_PLAYER_KEY);
    localStorage.removeItem(LAST_ADULT_KEY);
  } catch {}
}

// ── selected child player (per session) ──────────────────────────────────

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

/** The last child avatar chosen on this device — a hint for 1:1 pre-selection. */
export function getLastPlayer(): Player | null {
  if (!hasWindow()) return null;
  const p = readJson<Player>(localStorage, LAST_PLAYER_KEY);
  return p && typeof p.id === "string" && typeof p.avatar === "string" ? p : null;
}

// ── selected adult (per session) ─────────────────────────────────────────

export function getSelectedAdult(): Player | null {
  if (!hasWindow()) return null;
  const p = readJson<Player>(sessionStorage, ADULT_KEY);
  return p && typeof p.id === "string" && typeof p.avatar === "string" ? p : null;
}

export function setSelectedAdult(p: Player): void {
  if (!hasWindow()) return;
  try {
    sessionStorage.setItem(ADULT_KEY, JSON.stringify(p));
    localStorage.setItem(LAST_ADULT_KEY, JSON.stringify(p));
  } catch {}
}

export function clearSelectedAdult(): void {
  if (!hasWindow()) return;
  try {
    sessionStorage.removeItem(ADULT_KEY);
  } catch {}
}

export function getLastAdult(): Player | null {
  if (!hasWindow()) return null;
  const p = readJson<Player>(localStorage, LAST_ADULT_KEY);
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

/** Split a roster into its child and adult members. */
export function splitRoster(players: Player[]): { children: Player[]; adults: Player[] } {
  return {
    children: players.filter((p) => (p.kind ?? "child") === "child"),
    adults: players.filter((p) => p.kind === "adult"),
  };
}

export async function addPlayer(
  code: string,
  groupKind: GroupKind,
  avatar: string,
  playerKind: PlayerKind = "child",
): Promise<Player[] | null> {
  try {
    const res = await fetch(ROSTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: code, kind: groupKind, action: "add", avatar, playerKind }),
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
