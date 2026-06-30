/**
 * creaseworks-eval — engagement insights (designer-only).
 *
 * Reads the anonymous trace corpus (events + players + groups) and profiles
 * the PLAY, never the player. Three faces:
 *   • within-child — keyed on player_id (the only true child key): repertoire
 *     of play modes, return cadence, intraindividual variability. Computed
 *     ONLY where a player_id exists; anonymous sessions are labelled N/A.
 *   • variability in use — activity popularity, path-shape (% reach show,
 *     % look-only — a valid profile, not a deficit), breadth.
 *   • justice + negative indicators — populations to serve, and data-quality
 *     watches (bounce, anonymous/skip rate, roster coverage).
 *
 * Emergent-profile clustering runs offline from /api/eval/events/export.
 * force-dynamic: reads D1 per request.
 */

import Link from "next/link";
import { evalHref } from "@/lib/eval-nav";
import { apiUrl } from "@/lib/api-url";
import { getEvalEnv } from "@/lib/eval-server";

export const dynamic = "force-dynamic";

interface EventRow {
  group_code: string | null;
  player_id: string | null;
  device_token: string | null;
  session_id: string | null;
  event_type: string;
  stage: string | null;
  activity: string | null;
  created_at: string;
}
interface PlayerRow {
  id: string;
  group_code: string;
  avatar: string;
}
interface GroupRow {
  code: string;
  kind: string;
}

const STAGE_RANK: Record<string, number> = { look: 1, make: 2, show: 3, wow: 4 };

interface SessionAgg {
  session_id: string;
  group_code: string | null;
  player_id: string | null;
  stages: Set<string>;
  activities: Set<string>;
  maxRank: number;
  stageEnters: number;
  day: string;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export default async function EvalInsights() {
  const env = getEvalEnv();

  let events: EventRow[] = [];
  let players: PlayerRow[] = [];
  let groups: GroupRow[] = [];
  if (env) {
    events =
      (
        await env.db
          .prepare(
            // rolling 90-day window — bounds the scan as events grow over the
            // sprint (covers the whole pilot; uses idx_events_created).
            "SELECT group_code, player_id, device_token, session_id, event_type, stage, activity, created_at FROM events WHERE created_at >= datetime('now', '-90 days') ORDER BY created_at ASC",
          )
          .all<EventRow>()
      ).results ?? [];
    players = (await env.db.prepare("SELECT id, group_code, avatar FROM players").all<PlayerRow>()).results ?? [];
    groups = (await env.db.prepare("SELECT code, kind FROM groups").all<GroupRow>()).results ?? [];
  }

  // ── fold events into per-session aggregates ──────────────────────────────
  const sessions = new Map<string, SessionAgg>();
  for (const e of events) {
    if (!e.session_id) continue;
    let s = sessions.get(e.session_id);
    if (!s) {
      s = {
        session_id: e.session_id,
        group_code: e.group_code,
        player_id: e.player_id,
        stages: new Set(),
        activities: new Set(),
        maxRank: 0,
        stageEnters: 0,
        day: e.created_at.slice(0, 10),
      };
      sessions.set(e.session_id, s);
    }
    // a session's player_id is whichever non-null one appears (selection
    // may land after session_start)
    if (e.player_id && !s.player_id) s.player_id = e.player_id;
    if (e.group_code && !s.group_code) s.group_code = e.group_code;
    if (e.event_type === "stage_enter" && e.stage) {
      s.stages.add(e.stage);
      s.stageEnters += 1;
      s.maxRank = Math.max(s.maxRank, STAGE_RANK[e.stage] ?? 0);
    }
    if (e.event_type === "activity_open" && e.activity) s.activities.add(e.activity);
  }

  const allSessions = [...sessions.values()];
  const playedSessions = allSessions.filter((s) => s.stages.size > 0); // entered at least one stage
  const nSessions = allSessions.length;

  // ── path-shape / variability in use ──────────────────────────────────────
  const reachedShow = playedSessions.filter((s) => s.maxRank >= STAGE_RANK.show).length;
  const lookOnly = playedSessions.filter((s) => s.stages.has("look") && s.maxRank === STAGE_RANK.look).length;
  const neverShow = playedSessions.filter((s) => s.maxRank > 0 && s.maxRank < STAGE_RANK.show).length;
  const bounce = allSessions.filter((s) => s.stageEnters <= 1).length;

  const breadthVals = playedSessions.map((s) => s.activities.size).filter((n) => n > 0);
  const meanBreadth = breadthVals.length
    ? (breadthVals.reduce((a, b) => a + b, 0) / breadthVals.length).toFixed(1)
    : "—";

  // activity popularity
  const actCount = new Map<string, number>();
  for (const s of allSessions) for (const a of s.activities) actCount.set(a, (actCount.get(a) ?? 0) + 1);
  const actRanked = [...actCount.entries()].sort((a, b) => b[1] - a[1]);

  // ── within-child (player_id only) ────────────────────────────────────────
  const byPlayer = new Map<string, SessionAgg[]>();
  for (const s of allSessions) {
    if (!s.player_id) continue;
    const list = byPlayer.get(s.player_id) ?? [];
    list.push(s);
    byPlayer.set(s.player_id, list);
  }
  const avatarById = new Map(players.map((p) => [p.id, p.avatar]));

  interface ChildProfile {
    player_id: string;
    avatar: string;
    sessions: number;
    days: number;
    repertoire: number; // distinct activities across visits
    meanModes: string; // mean distinct activities per session
    amplitude: number; // range of distinct-activities-per-session (IIV proxy)
    reachedShow: number;
  }
  const childProfiles: ChildProfile[] = [...byPlayer.entries()]
    .map(([pid, list]) => {
      const days = new Set(list.map((s) => s.day)).size;
      const repertoire = new Set(list.flatMap((s) => [...s.activities])).size;
      const modesPer = list.map((s) => s.activities.size);
      const meanModes = modesPer.length ? (modesPer.reduce((a, b) => a + b, 0) / modesPer.length).toFixed(1) : "0";
      const amplitude = modesPer.length ? Math.max(...modesPer) - Math.min(...modesPer) : 0;
      return {
        player_id: pid,
        avatar: avatarById.get(pid) ?? "unknown",
        sessions: list.length,
        days,
        repertoire,
        meanModes,
        amplitude,
        reachedShow: list.filter((s) => s.maxRank >= STAGE_RANK.show).length,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || b.repertoire - a.repertoire);

  const returningChildren = childProfiles.filter((c) => c.days >= 2).length;

  // ── cohort (family vs class) ─────────────────────────────────────────────
  const groupKind = new Map(groups.map((g) => [g.code, g.kind]));
  function cohort(kind: "family" | "class") {
    const codes = new Set(groups.filter((g) => g.kind === kind).map((g) => g.code));
    const sess = allSessions.filter((s) => s.group_code && codes.has(s.group_code));
    const plyrs = new Set(sess.map((s) => s.player_id).filter(Boolean));
    return { groups: codes.size, sessions: sess.length, players: plyrs.size };
  }
  const fam = cohort("family");
  const cls = cohort("class");

  // ── justice + negative indicators ────────────────────────────────────────
  // roster coverage: players set up but never seen in any event
  const seenPlayerIds = new Set(events.map((e) => e.player_id).filter(Boolean));
  const neverPlayed = players.filter((p) => !seenPlayerIds.has(p.id)).length;

  // anonymous/skip rate: sessions on a roster device (group set) but no
  // player chosen — mis-tap / skip; a data-quality watch
  const rosterSessions = allSessions.filter((s) => s.group_code);
  const anonOnRoster = rosterSessions.filter((s) => !s.player_id).length;

  const empty = nSessions === 0;

  return (
    <div>
      <style>{`
        .in-h1 { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 24px; color: var(--wv-cadet); margin: 0 0 4px; }
        .in-sub { font-size: 14px; color: #4b5563; margin: 0 0 18px; line-height: 1.6; }
        .in-stats { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
        .in-stat { background: var(--wv-white); border-radius: 14px; padding: 12px 16px; border: 1px solid rgba(39,50,72,0.08); }
        .in-stat b { display: block; font-size: 22px; font-weight: 800; color: var(--wv-cadet); }
        .in-stat span { font-size: 12px; color: #6b7280; }
        .in-card { background: var(--wv-white); border: 1.5px solid rgba(39,50,72,0.10); border-radius: 18px 22px 16px 20px;
          padding: 18px; margin-bottom: 18px; box-shadow: 0 3px 0 rgba(39,50,72,0.06); overflow-x: auto; }
        .in-card h2 { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 18px; color: var(--wv-cadet); margin: 0 0 4px; }
        .in-card p.note { font-size: 12.5px; color: #6b7280; margin: 0 0 14px; line-height: 1.5; }
        .in-bars { display: flex; flex-direction: column; gap: 8px; }
        .in-bar-row { display: grid; grid-template-columns: 120px 1fr 38px; gap: 10px; align-items: center; }
        .in-bar-label { font-size: 12.5px; font-weight: 700; color: var(--wv-cadet); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .in-bar-track { background: rgba(39,50,72,0.07); border-radius: 999px; height: 14px; overflow: hidden; }
        .in-bar-fill { height: 100%; border-radius: 999px; background: color-mix(in srgb, var(--wv-teal) 55%, var(--wv-white)); }
        .in-bar-val { font-size: 12px; font-weight: 800; color: var(--wv-cadet); text-align: right; }
        table.in-tbl { border-collapse: collapse; width: 100%; }
        .in-tbl th, .in-tbl td { padding: 8px 10px; font-size: 13px; text-align: left; border-bottom: 1px solid rgba(39,50,72,0.07); }
        .in-tbl th { font-weight: 800; color: var(--wv-cadet); }
        .in-tbl td.num, .in-tbl th.num { text-align: right; }
        .in-ind { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 560px) { .in-ind { grid-template-columns: 1fr; } }
        .in-ind-box { border: 1.5px solid rgba(39,50,72,0.12); border-radius: 14px; padding: 14px; }
        .in-ind-box.justice { background: color-mix(in srgb, var(--wv-seafoam) 14%, var(--wv-white)); }
        .in-ind-box.neg { background: color-mix(in srgb, var(--wv-sienna) 12%, var(--wv-white)); }
        .in-ind-h { font-weight: 800; font-size: 13px; color: var(--wv-cadet); margin: 0 0 8px; }
        .in-ind-row { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed rgba(39,50,72,0.1); }
        .in-ind-row:last-child { border-bottom: none; }
        .in-ind-row b { font-weight: 800; color: var(--wv-cadet); }
        .in-cohorts { display: flex; gap: 14px; flex-wrap: wrap; }
        .in-cohort { flex: 1; min-width: 150px; border: 1.5px solid rgba(39,50,72,0.12); border-radius: 14px; padding: 14px; }
        .in-cohort h3 { font-size: 14px; font-weight: 800; color: var(--wv-cadet); margin: 0 0 8px; }
        .in-cohort .in-ind-row { font-size: 13px; }
        .in-empty { background: var(--wv-white); border-radius: 16px; padding: 28px; text-align: center; color: #6b7280; border: 1px dashed rgba(39,50,72,0.2); }
        .in-back { font-size: 13px; font-weight: 800; color: var(--wv-teal); text-decoration: none; }
        .in-export { display: inline-block; margin-bottom: 18px; font-size: 13px; font-weight: 800; color: var(--wv-white);
          background: var(--wv-navy); border-radius: 12px; padding: 9px 16px; text-decoration: none; }
        .in-disclaimer { font-size: 12px; color: #6b7280; line-height: 1.55; margin: 4px 0 18px; padding: 10px 14px;
          background: color-mix(in srgb, var(--wv-periwinkle) 14%, var(--wv-white)); border-radius: 12px; }
      `}</style>

      <h1 className="in-h1">engagement insights</h1>
      <p className="in-sub">
        how children play, and how one child varies across visits — designer-only, for tuning the playdates.
        we profile the <strong>play</strong>, never the player. the look-only child is a valid profile, not a deficit.
      </p>

      <p className="in-disclaimer">
        anonymous throughout: a child is only ever a colour + animal (no names). within-child stats are computed
        only where a buddy was chosen; anonymous sittings are counted in the totals and the data-quality watch
        below, never forced into a child profile.
      </p>

      {empty ? (
        <div className="in-empty">
          no traces yet — play a few mini sessions (and set up a roster) to populate this.
          <br />
          <Link href={evalHref("/dashboard")} className="in-back">go to the coherence dashboard →</Link>
        </div>
      ) : (
        <>
          <div className="in-stats">
            <div className="in-stat"><b>{nSessions}</b><span>sessions</span></div>
            <div className="in-stat"><b>{childProfiles.length}</b><span>children seen</span></div>
            <div className="in-stat"><b>{returningChildren}</b><span>returned (2+ days)</span></div>
            <div className="in-stat"><b>{players.length}</b><span>roster buddies</span></div>
            <div className="in-stat"><b>{groups.length}</b><span>groups</span></div>
          </div>

          <a className="in-export" href={apiUrl("/api/eval/events/export")}>
            ⬇ export traces (JSON) for offline clustering
          </a>

          <div className="in-card">
            <h2>path-shape — how sessions move</h2>
            <p className="note">
              of {playedSessions.length} sessions that entered at least one stage. reaching show is one good ending;
              looking-only is another valid way to play.
            </p>
            <div className="in-bars">
              {[
                { label: "reached show", n: reachedShow, d: playedSessions.length, hue: "var(--wv-seafoam)" },
                { label: "never reached show", n: neverShow, d: playedSessions.length, hue: "var(--wv-sienna)" },
                { label: "look-only", n: lookOnly, d: playedSessions.length, hue: "var(--wv-periwinkle)" },
              ].map((r) => (
                <div key={r.label} className="in-bar-row">
                  <span className="in-bar-label">{r.label}</span>
                  <span className="in-bar-track">
                    <span className="in-bar-fill" style={{ width: `${pct(r.n, r.d)}%`, background: `color-mix(in srgb, ${r.hue} 55%, var(--wv-white))` }} />
                  </span>
                  <span className="in-bar-val">{pct(r.n, r.d)}%</span>
                </div>
              ))}
            </div>
            <p className="note" style={{ marginTop: 12, marginBottom: 0 }}>
              mean play-modes opened per session: <strong>{meanBreadth}</strong> (breadth vs fixation).
            </p>
          </div>

          <div className="in-card">
            <h2>which playdates get opened</h2>
            <p className="note">activity_open counts — what the match-rate actually surfaces in play.</p>
            {actRanked.length === 0 ? (
              <p className="note">no activity opens recorded yet.</p>
            ) : (
              <div className="in-bars">
                {actRanked.map(([act, n]) => (
                  <div key={act} className="in-bar-row">
                    <span className="in-bar-label">{act}</span>
                    <span className="in-bar-track">
                      <span className="in-bar-fill" style={{ width: `${pct(n, actRanked[0][1])}%` }} />
                    </span>
                    <span className="in-bar-val">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="in-card">
            <h2>within-child — repertoire &amp; return</h2>
            <p className="note">
              keyed on the chosen buddy (the only true child key). repertoire = distinct play-modes across visits;
              variability = the swing in modes-per-session (an intraindividual-variability proxy). returning children
              (2+ days) anchor the within-child read.
            </p>
            {childProfiles.length === 0 ? (
              <p className="note">
                no buddy-attributed sessions yet — within-child is <strong>N/A</strong> until a roster is set up and
                children tap who&rsquo;s playing. (all play so far is anonymous; see totals + the data-quality watch.)
              </p>
            ) : (
              <table className="in-tbl">
                <thead>
                  <tr>
                    <th>buddy</th>
                    <th className="num">visits</th>
                    <th className="num">days</th>
                    <th className="num">repertoire</th>
                    <th className="num">modes/visit</th>
                    <th className="num">variability</th>
                    <th className="num">reached show</th>
                  </tr>
                </thead>
                <tbody>
                  {childProfiles.slice(0, 30).map((c) => (
                    <tr key={c.player_id}>
                      <td>{c.avatar}</td>
                      <td className="num">{c.sessions}</td>
                      <td className="num">{c.days}</td>
                      <td className="num">{c.repertoire}</td>
                      <td className="num">{c.meanModes}</td>
                      <td className="num">{c.amplitude}</td>
                      <td className="num">{c.reachedShow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="in-card">
            <h2>cohorts — family vs class</h2>
            <p className="note">kept separate; a classroom and a living room are different rooms.</p>
            <div className="in-cohorts">
              <div className="in-cohort">
                <h3>👪 families</h3>
                <div className="in-ind-row"><span>groups</span><b>{fam.groups}</b></div>
                <div className="in-ind-row"><span>sessions</span><b>{fam.sessions}</b></div>
                <div className="in-ind-row"><span>children</span><b>{fam.players}</b></div>
              </div>
              <div className="in-cohort">
                <h3>🏫 classes</h3>
                <div className="in-ind-row"><span>groups</span><b>{cls.groups}</b></div>
                <div className="in-ind-row"><span>sessions</span><b>{cls.sessions}</b></div>
                <div className="in-ind-row"><span>children</span><b>{cls.players}</b></div>
              </div>
            </div>
          </div>

          <div className="in-card">
            <h2>indicators we hold ourselves to</h2>
            <p className="note">
              every read carries a justice lens (who are we under-serving?) and a negative lens (what&rsquo;s the
              data, or the experience, failing at?).
            </p>
            <div className="in-ind">
              <div className="in-ind-box justice">
                <p className="in-ind-h">⚖ justice — populations to serve</p>
                <div className="in-ind-row"><span>look-only sittings</span><b>{pct(lookOnly, playedSessions.length)}%</b></div>
                <div className="in-ind-row"><span>never reached show</span><b>{pct(neverShow, playedSessions.length)}%</b></div>
                <div className="in-ind-row"><span>roster buddies who never played</span><b>{neverPlayed}</b></div>
              </div>
              <div className="in-ind-box neg">
                <p className="in-ind-h">⚠ negative — what&rsquo;s failing</p>
                <div className="in-ind-row"><span>bounce (≤1 stage)</span><b>{pct(bounce, nSessions)}%</b></div>
                <div className="in-ind-row"><span>anonymous on a roster device</span><b>{pct(anonOnRoster, rosterSessions.length)}%</b></div>
                <div className="in-ind-row"><span>roster sittings total</span><b>{rosterSessions.length}</b></div>
              </div>
            </div>
          </div>
        </>
      )}

      <Link href={evalHref("/dashboard")} className="in-back">← back to the coherence dashboard</Link>
    </div>
  );
}
